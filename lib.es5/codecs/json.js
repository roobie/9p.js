'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.encode = encode;
exports.decode = decode;
function encode(x) {
  return JSON.stringify(x);
}

function decode(x) {
  return JSON.parse(x);
}

// re: WIRE_FORMAT
var dataTransferEncoding = exports.dataTransferEncoding = 'utf-8';
var httpContentType = exports.httpContentType = 'application/json';