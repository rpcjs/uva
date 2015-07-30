'use strict';

var ServerError = require('../lib/index').ServerError;
var expect = require('chai').expect;

describe('ServerError', function() {
  it('should contain type and message after creation', function() {
    var serverError = new ServerError('foo', 'bar');
    expect(serverError.type).to.be.equal('foo');
    expect(serverError.message).to.be.equal('bar');
  });
});
