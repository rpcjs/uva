'use strict';

var ServerError = require('./server-error');
var StateEmitter = require('state-emitter');
var CallbackStore = require('callback-store');
var util = require('util');
var kamikaze = require('kamikaze');
var debug = require('debug')('uva');

var DEFAULT_TTL = 5 * 1000; // 5 sec.

function Client(transport, opts) {
  opts = opts || {};
  StateEmitter.call(this);

  if (!transport) {
    throw new TypeError('uva client should have a transport');
  }

  this._transport = transport;
  this._ttl = opts.ttl || DEFAULT_TTL;
  this._callbackStore = new CallbackStore();
  this.methods = {};

  this._listen();
  this._tryConnect();
}

util.inherits(Client, StateEmitter);

Client.prototype._listen = function() {
  var handlers = (function(client) {
    return {
      ready: function() {
        client._tryConnect();
      },
      newMethod: function(methodName) {
        client.register(methodName);
        client.state(methodName + 'Ready');
      },
      response: function(params) {
        client._callbackStore.exec(params.cid, {}, params.args);
      }
    };
  })(this);

  this._transport.subscribe(function(type, params) {
    var handler = handlers[type] || function() {};
    handler(params);
  });
};

Client.prototype._tryConnect = function() {
  var cb = function(err, methodList) {
    if (err) {
      return;
    }
    this.register(methodList);
    methodList.forEach(function(methodName) {
      this.state(methodName + 'Ready');
    }.bind(this));
    this.state('connect');
  }.bind(this);

  this._publishCall('connect', [], cb);
};

/**
 * @callback requestCallback
 * @param {Error} error - The error that happened during executing
 *   the remote method.
 * @param {..*} responseData - The data returned by the remote method.
 */
/**
 * Call a remote method.
 * @param {string} methodName - The name of the method to be called.
 * @param {...*} arguments - The arguments to be passed to the method.
 * @param {requestCallback} [cb] - The callback that handles the response.
 */
Client.prototype.call = function(methodName) {
  var args = [];
  var i = 0;
  var cb;

  if (!methodName) {
    throw new TypeError('call requires a methodName');
  }
  if (typeof methodName !== 'string') {
    throw new TypeError('call requires a methodName of string type');
  }

  while (typeof arguments[++i] !== 'function' && i < arguments.length) {
    args.push(arguments[i]);
  }

  if (typeof arguments[i] === 'function') {
    cb = arguments[i];
  }

  debug('calling %s with args %j', methodName, args);
  this.once(methodName + 'Ready', kamikaze(function(err) {
    if (err) {
      cb(err);
      return;
    }
    this._publishCall(methodName, args, cb);
  }.bind(this), this._ttl));
};

Client.prototype._publishCall = function(methodName, args, cb) {
  this._transport.publish('call', {
    methodName: methodName,
    cid: cb ? this._callbackStore.add(cb) : undefined,
    args: args
  });
};

Client.prototype._createMethod = function(methodName) {
  return function() {
    var args = [methodName].concat(Array.prototype.slice.call(arguments));
    this.call.apply(this, args);
  }.bind(this);
};

Client.prototype.register = function(methods) {
  if (!(methods instanceof Array)) {
    methods = [methods];
  }
  methods.forEach(function(method) {
    if (typeof this.methods[method] === 'undefined') {
      this.methods[method] = this._createMethod(method);
    }
  }.bind(this));
};

module.exports = Client;
