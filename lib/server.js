'use strict';

var StateEmitter = require('state-emitter');
var debug = require('debug')('uva');
var noop = function() {};

function Server(transport, opts) {
  if (!transport) {
    throw new TypeError('uva server should have a transport');
  }

  opts = opts || {};

  this._stateEmitter = new StateEmitter();
  this._transport = transport;
  this._methods = [];

  this._transport.subscribe(function(type, params) {
    if (type !== 'call') {
      return;
    }
    this._call(params);
  }.bind(this));

  this.addMethod('connect', function(cb) {
    cb(null, this._methods);
  }.bind(this));

  this._transport.publish('ready');
}

Server.prototype._call = function(params) {
  if (!params) {
    throw new Error('params is required');
  }

  this._stateEmitter.once(params.methodName + 'Ready', function(method) {
    var cb = this._createCallback(params.cid);
    var args = params.args.concat([cb]);
    method.apply({}, args);
  }.bind(this));
};

Server.prototype._createCallback = function(cid) {
  if (cid) {
    return function() {
      var msg = {
        cid: cid,
        args: Array.prototype.slice.call(arguments)
      };
      this._transport.publish('response', msg);
    }.bind(this);
  }
  return function() {};
};

Server.prototype.addMethod = function(methodName, method) {
  if (!methodName) {
    throw new TypeError('addMethod requires a methodName');
  }
  if (typeof methodName !== 'string') {
    throw new TypeError('addMethod requires a methodName of string type');
  }
  if (method === null || typeof method !== 'function') {
    throw new TypeError('addMethod requires a callback function');
  }

  this._methods.push(methodName);
  this._transport.publish('newMethod', methodName);
  this._stateEmitter.state(methodName + 'Ready', method);
};

Server.prototype.addMethods = function(scope) {
  if (typeof scope !== 'object') {
    throw new Error('scope should be an object');
  }

  for (var methodName in scope) {
    this.addMethod(methodName, scope[methodName]);
  }
};

module.exports = Server;
