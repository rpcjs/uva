'use strict';

var Server = require('../lib/server');
var expect = require('chai').expect;
var sinon = require('sinon');

var noop = function() {};
var dummyTransport = {
  subscribe: noop,
  publish: noop,
  once: noop
};

describe('uva server addMethod', function() {
  it('should throw an error if no parameters were passed', function() {
    var server = new Server(dummyTransport);
    expect(function() {
      server.addMethod();
    }).to.throw(TypeError, 'addMethod requires a methodName');
  });

  it('should throw an error if no callback function is passed', function() {
    var server = new Server(dummyTransport);
    expect(function() {
      server.addMethod('foo');
    }).to.throw(TypeError, 'addMethod requires a callback function');
  });

  it('should throw an error if invalid callback function is passed', function() {
    var server = new Server(dummyTransport);
    expect(function() {
      server.addMethod('foo', 234);
    }).to.throw(TypeError, 'addMethod requires a callback function');
  });

  it('should not throw an exception if the second parameter is a callback function', function() {
    var server = new Server(dummyTransport);
    expect(function() {
      server.addMethod('foo', noop);
    }).not.to.throw(Error);
  });
});

describe('uva client/server communication', function() {
  it('should pass all the arguments', function() {
    var publishSpy = sinon.spy();
    var transport = {
      once: noop,
      publish: publishSpy,
      subscribe: function(cb) {
        cb('call', {
          methodName: 'sum',
          cid: 'ff3f4f3f',
          args: [32, 54]
        });
      }
    };
    var server = new Server(transport);
    var sumSpy = sinon.spy(function(a, b, cb) {
      cb(a + b);
    });
    server.addMethod('sum', sumSpy);

    expect(sumSpy.calledOnce).to.be.true;
    expect(sumSpy.calledWith(32, 54)).to.be.true;
    expect(sumSpy.getCall(0).args[2]).to.be.a('function');
    expect(publishSpy.calledWithExactly('response', {
      cid: 'ff3f4f3f',
      args: [86]
    })).to.be.true;
  });
});
