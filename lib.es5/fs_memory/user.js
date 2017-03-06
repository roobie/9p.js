'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var GROUP_ALL = exports.GROUP_ALL = {
  gid: 'all'
};
var USER_DEFAULT = exports.USER_DEFAULT = {
  uid: 'anonymous',
  groups: [GROUP_ALL]
};

var GROUP_WHEEL = exports.GROUP_WHEEL = {
  gid: 'wheel'
};
var ROOT_USER = exports.ROOT_USER = {
  uid: 'root',
  groups: [GROUP_WHEEL]
};