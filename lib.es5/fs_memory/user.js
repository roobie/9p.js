'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
const GROUP_ALL = exports.GROUP_ALL = {
  gid: 'all'
};
const USER_DEFAULT = exports.USER_DEFAULT = {
  uid: 'anonymous',
  groups: [GROUP_ALL]
};

const GROUP_WHEEL = exports.GROUP_WHEEL = {
  gid: 'wheel'
};
const ROOT_USER = exports.ROOT_USER = {
  uid: 'root',
  groups: [GROUP_WHEEL]
};