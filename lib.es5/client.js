'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.attach = attach;
exports.Client = Client;
// attach, walk, open, read, close
function attach(service, chain) {
  var myFid = Math.floor(Math.random() * 1024) + 1024;
  var request = { type: service.msgtype.Tattach, tag: 3000, fid: myFid };
  var reply = service.answer(request);
  chain(request, reply);
  reply = service.answer({ type: service.msgtype.Tclunk, tag: 3000, fid: myFid });
  if (reply.type === service.msgtype.Rerror) {
    throw reply.ename;
  }
}

function Client() {
  throw new Error('not implemented');
}