/**
 * `ServerError` error.
 *
 * @api private
 */
function ServerError(type, message) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'ServerError';
  this.message = message;
  this.type = type;
}

/**
 * Inherit from `Error`.
 */
ServerError.prototype.__proto__ = Error.prototype;


/**
 * Expose `ServerError`.
 */
module.exports = ServerError;
