'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _structs = require('../structs');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Qid {
  constructor(type, version, path) {
    (0, _assert2.default)(typeof type === 'number', 'type must be a number');
    (0, _assert2.default)(typeof version === 'number', 'version must be a number');
    (0, _assert2.default)(typeof path === 'number', 'path must be a number');

    Object.defineProperties(this, {
      type: { value: type },
      version: { value: version },
      path: { value: path }
    });
  }

  equals(otherQid) {
    return this.valueOf() === otherQid.valueOf();
  }

  toBuffer() {
    return (0, _structs.Qid)(this).buffer();
  }

  toString() {
    return `${this.type.toString(16)}:${this.version}:${this.path}`;
  }

  valueOf() {
    return this.toBuffer().toString('hex');
  }

  toJSON() {
    return this;
  }
}
exports.default = Qid;