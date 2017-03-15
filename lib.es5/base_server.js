'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _protocol_data = require('./protocol_data');

var _log = require('log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class BaseServer {
  constructor({
    FsImplementation,
    authenticationService,
    codec,
    log
  }) {
    // this.authenticationService = authenticationService
    this.implementation = new FsImplementation({
      authenticationService,
      log
    });
    this.codec = codec;

    this.log = log || new _log2.default('info');
  }

  dispatch(data) {
    const tpacket = this.codec.decode(data);

    this.log.debug('Packet[RX]:', tpacket);

    if (!tpacket.tag) {
      const errMsg = 'Packet must contain a tag';
      return this.error9p(tpacket.tag, errMsg);
    }

    if (_protocol_data.packets[tpacket.type]) {
      const handlerName = _protocol_data.packets[tpacket.type];
      if (!handlerName) {
        const errMsg = `No handler found for [${tpacket.type}]. This is a bug.`;
        this.log.critical(tpacket);
        return this.error9p(tpacket.tag, errMsg);
      }

      if (handlerName in this.implementation) {
        let response;

        try {
          response = this.implementation[handlerName](tpacket);
        } catch (e) {
          this.log.critical(e);
          const errMsg = this.log.level === _log2.default.DEBUG ? e.message : 'Internal server error';

          return this.error9p(tpacket.tag, errMsg);
        }

        return response.then(rpacket => this.send9p(rpacket), err => {
          this.log.error(err);
          return this.error9p(err.tag, err.message);
        });
      }
    }

    const errMsg = `The type(${tpacket.type}) is not implemented.`;
    this.log.debug('Error:', errMsg);
    return this.error9p(tpacket.tag, errMsg);
  }

  error9p(tag, msg) {
    return new _bluebird2.default(resolve => {
      const rpacket = { type: _protocol_data.packetType.Rerror, tag: tag, ename: msg };
      const data = this.codec.encode(rpacket);

      this.log.debug('Packet[TX]:', data);
      resolve(data);
    });
  }

  send9p(rpacket) {
    // we could add validation here.
    return new _bluebird2.default(resolve => {
      const data = this.codec.encode(rpacket);

      this.log.debug('Packet[TX]:', data);
      resolve(data);
    });
  }
}
exports.default = BaseServer;