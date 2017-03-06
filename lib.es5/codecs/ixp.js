'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.httpContentType = exports.dataTransferEncoding = undefined;
exports.encode = encode;
exports.decode = decode;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _protocol_data = require('../protocol_data');

var _structs = require('../structs');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * This is a binary format, so we want the data to be
 * transmitted and received in raw binary
 */
var dataTransferEncoding = exports.dataTransferEncoding = null;

/**
 * When transported via HTTP, the client should handle the response
 * as raw binary data.
 */
var httpContentType = exports.httpContentType = 'application/octet-stream';

function encode(packet) {
  if (packet.type in handlersR) {
    return handlersR[packet.type](packet);
  }

  throw new Error('not implemented');
}

/**
 * Converts a byte buffer into an internal representation of a packet
 * @param {Buffer} buffer - the buffer containing the data
 * @returns the internal representation of the data
 */
function decode(buffer) {
  var offset = 0;
  var size = buffer.slice(offset, _protocol_data.fieldSizes.size).readUInt32LE();
  offset = _protocol_data.fieldSizes.size;
  var type = buffer.slice(offset, offset + _protocol_data.fieldSizes.type).readInt8();
  offset = _protocol_data.fieldSizes.size + _protocol_data.fieldSizes.type;

  var handler = handlersT[type];
  if (type in handlersT) {
    return handler(size, buffer.slice(offset));
  }

  throw new Error('not implemented');
}
var handlersR = {
  101: function RversionHandler(packet) {
    return (0, _structs.Rversion)(packet).buffer();
  }
};

var handlersT = {
  100: function TversionHandler(size, buffer) {
    // Since we don't know how long the `version` string is, we need to eat the buffer
    // byte by byte, until we get to the `msize` data, which tells us how long the string
    // is, which is why we're not using `Struct` here.
    var minimumSize = _protocol_data.fieldSizes.tag + _protocol_data.fieldSizes.msize;
    (0, _assert2.default)(size >= minimumSize, 'Must be at least ' + minimumSize + ' bytes');

    var data = bufferReader(buffer).consume(_protocol_data.fieldSizes.tag, 'tag', function (data) {
      return data.readUInt16LE();
    }).consume(_protocol_data.fieldSizes.msize, 'msize', function (data) {
      return data.readUInt32LE();
    }).consume(-1, 'version', function (data) {
      return data.utf8Slice();
    }).done();

    return {
      size: size,
      type: _protocol_data.packetType.Tversion,
      tag: data.tag,
      msize: data.msize,
      version: data.version
    };
  }
};

function bufferReader(buffer) {
  var offset = 0;
  var acc = {};

  return {
    consume: function consume(nbytes, name, callback) {
      var result = null;
      if (nbytes === -1) {
        result = buffer.slice(offset);
      } else {
        result = buffer.slice(offset, offset + nbytes);
      }
      offset += nbytes;
      acc[name] = callback(result);
      return this;
    },
    done: function done() {
      return acc;
    }
  };
}