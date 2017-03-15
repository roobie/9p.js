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
const dataTransferEncoding = exports.dataTransferEncoding = null;

/**
 * When transported via HTTP, the client should handle the response
 * as raw binary data.
 */
const httpContentType = exports.httpContentType = 'application/octet-stream';

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
  let offset = 0;
  const size = buffer.slice(offset, _protocol_data.fieldSizes.size).readUInt32LE();
  offset = _protocol_data.fieldSizes.size;
  const type = buffer.slice(offset, offset + _protocol_data.fieldSizes.type).readInt8();
  offset = _protocol_data.fieldSizes.size + _protocol_data.fieldSizes.type;

  const handler = handlersT[type];
  if (type in handlersT) {
    return handler(size, buffer.slice(offset));
  }

  throw new Error('not implemented');
}
const handlersR = {
  101: function RversionHandler(packet) {
    return (0, _structs.Rversion)(packet).buffer();
  }
};

const handlersT = {
  100: function TversionHandler(size, buffer) {
    // Since we don't know how long the `version` string is, we need to eat the buffer
    // byte by byte, until we get to the `msize` data, which tells us how long the string
    // is, which is why we're not using `Struct` here.
    const minimumSize = _protocol_data.fieldSizes.tag + _protocol_data.fieldSizes.msize;
    (0, _assert2.default)(size >= minimumSize, `Must be at least ${minimumSize} bytes`);

    const data = bufferReader(buffer).consume(_protocol_data.fieldSizes.tag, 'tag', data => data.readUInt16LE()).consume(_protocol_data.fieldSizes.msize, 'msize', data => data.readUInt32LE()).consume(-1, 'version', data => data.utf8Slice()).done();

    return {
      size,
      type: _protocol_data.packetType.Tversion,
      tag: data.tag,
      msize: data.msize,
      version: data.version
    };
  }
};

function bufferReader(buffer) {
  let offset = 0;
  const acc = {};

  return {
    consume: function (nbytes, name, callback) {
      let result = null;
      if (nbytes === -1) {
        result = buffer.slice(offset);
      } else {
        result = buffer.slice(offset, offset + nbytes);
      }
      offset += nbytes;
      acc[name] = callback(result);
      return this;
    },
    done: function () {
      return acc;
    }
  };
}