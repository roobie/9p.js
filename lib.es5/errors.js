"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
class IxpTaggedError extends Error {
  constructor(tag, msg) {
    super(msg);
    this.tag = tag;
  }
}
exports.IxpTaggedError = IxpTaggedError;