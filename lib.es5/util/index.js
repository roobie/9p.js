'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.octal = octal;
exports.isNil = isNil;

var _range = require('./range');

var _range2 = _interopRequireDefault(_range);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  range: _range2.default
};
function octal(x) {
  return parseInt(x, 8);
}

function isNil(x) {
  return x === undefined || x === null;
}