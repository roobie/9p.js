'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = range;
function range(from, to, step) {
  return new Array(Math.ceil((to - from) / (step || 1))).join(' ').split(' ').map(function (_, i) {
    return from + i * (step || 1);
  });
}