'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.httpContentType = exports.dataTransferEncoding = undefined;
exports.encode = encode;
exports.decode = decode;

var _libsodiumWrappers = require('libsodium-wrappers');

var _libsodiumWrappers2 = _interopRequireDefault(_libsodiumWrappers);

var _buffer = require('buffer');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// re: WIRE_FORMAT
/**
 * NOT SAFE (as in, not verified to be safe)
 */

var dataTransferEncoding = exports.dataTransferEncoding = null;
var httpContentType = exports.httpContentType = 'application/octet-stream';

// data format
var dataEncoding = 'utf8';
function encode(plainObject) {
  var plainText = JSON.stringify(plainObject);
  return encrypt(plainText);
}

function decode(cipherBuffer) {
  var json = decrypt(cipherBuffer);
  return JSON.parse(json);
}

// Load your secret key from a safe place and reuse it across multiple
// secretbox calls.
var secret = _libsodiumWrappers2.default.crypto_generichash(_libsodiumWrappers2.default.crypto_box_PUBLICKEYBYTES, 'secret');

// Given a message as a string, return a Buffer containing the
// nonce (in the first 24 bytes) and the encrypted content.
function encrypt(message) {
  // You must use a different nonce for each message you encrypt.
  var nonce = _buffer.Buffer.from(_libsodiumWrappers2.default.randombytes_buf(_libsodiumWrappers2.default.crypto_box_NONCEBYTES));
  var buf = _buffer.Buffer.from(message, dataEncoding);
  return _buffer.Buffer.concat([nonce, _buffer.Buffer.from(_libsodiumWrappers2.default.crypto_secretbox_easy(buf, nonce, secret))]);
}

// Decrypt takes a Buffer and returns the decrypted message as plain text.
function decrypt(encryptedBuffer) {
  var nonce = encryptedBuffer.slice(0, _libsodiumWrappers2.default.crypto_box_NONCEBYTES);
  var encryptedMessage = encryptedBuffer.slice(_libsodiumWrappers2.default.crypto_box_NONCEBYTES);
  return _libsodiumWrappers2.default.crypto_secretbox_open_easy(encryptedMessage, nonce, secret, 'text');
}