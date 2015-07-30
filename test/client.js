'use strict';

var Client = require('../lib/client');
var expect = require('chai').expect;
var sinon = require('sinon');
var noop = function() {};
var dummyTransport = {
  subscribe: noop,
  publish: noop
};

describe('Uva client', function() {
  describe('call', function() {
    it('should throw an error if no parameters were passed', function() {
      var client = new Client(dummyTransport, {
        name: 'foo'
      });

      expect(function() {
        client.call();
      }).to.throw(TypeError, 'call requires a methodName');
    });

    it('should not throw an error if the third parameter is not a function', function() {
      var client = new Client(dummyTransport, {
        name: 'foo'
      });

      expect(function() {
        client.call('foo', null, 4234);
      }).not.to.throw(Error);
    });

    it('should not throw an exception if the second parameter is a callback function', function() {
      var client = new Client(dummyTransport, {
        name: 'foo'
      });

      expect(function() {
        client.call('foo', noop);
      }).not.to.throw(Error);
    });

    it('should not throw an exception if the third parameter is a callback function', function() {
      var client = new Client(dummyTransport, {
        name: 'foo'
      });

      expect(function() {
        client.call('foo', {
          a: 34
        }, noop);
      }).not.to.throw(Error);
    });

    it('should not throw an exception if no callback function passed', function() {
      var client = new Client(dummyTransport, {
        name: 'foo'
      });

      expect(function() {
        client.call('foo', {
          a: 34
        });
      }).not.to.throw(Error);
    });
  });

  describe('register', function() {
    it('should register one method', function() {
      var client = new Client(dummyTransport, {
        name: 'foo'
      });

      client.register('foo1');
      expect(client.methods.foo1).to.be.a('function');
    });

    it('should register several methods', function() {
      var client = new Client(dummyTransport, {
        name: 'foo'
      });

      client.register(['foo2', 'foo3']);
      expect(client.methods.foo2).to.be.a('function');
      expect(client.methods.foo3).to.be.a('function');
    });
  });
});
