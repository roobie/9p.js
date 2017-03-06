'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _util = require('../util');

var _user = require('./user');

var _file = require('./file.js');

var _file2 = _interopRequireDefault(_file);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Fid {
  constructor({ file, mode, user }) {
    // TODO : how to get current user from OS??
    (0, _assert2.default)(file instanceof _file2.default, '`file` must be a `File`');
    (0, _assert2.default)(typeof mode === 'number', 'mode must be a number');
    (0, _assert2.default)(mode >= 0 && mode <= (0, _util.octal)('0777'), 'mode must be between (0..0xfff]');

    Object.defineProperties(this, {
      file: { value: file },
      user: { value: user || _user.USER_DEFAULT }
    });

    this.mode = mode;
  }

  clone() {
    return new Fid({ file: this.file, mode: this.mode, user: this.user });
  }
}
exports.default = Fid;