'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _net = require('net');

var _xtend = require('xtend');

var _xtend2 = _interopRequireDefault(_xtend);

var _base_server = require('./base_server');

var _base_server2 = _interopRequireDefault(_base_server);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getSocketHandler(getId, ixpServer) {
  return function (socket) {
    const id = getId();
    ixpServer.log.info('Received connection: #[%d]', id);

    // re: WIRE_FORMAT
    // cf. https://nodejs.org/api/stream.html#stream_readable_setencoding_encoding
    // cf. https://nodejs.org/api/net.html#net_socket_setencoding_encoding
    socket.setEncoding(ixpServer.codec.dataTransferEncoding);

    socket.on('data', data => {
      ixpServer.log.debug('Received data: #[%d]', id);
      ixpServer.dispatch(data).then(rpacket => {
        ixpServer.log.debug('Sending data: #[%d]', id);
        socket.write(rpacket);
      });
    });

    socket.on('end', () => {
      ixpServer.log.debug('Socket ended: #[%d]', id);
    });

    socket.on('close', () => {
      ixpServer.log.info('Socket closed: #[%d]', id);
    });
  };
}

class TcpServer extends _base_server2.default {
  listen(serverConfig) {
    return new Promise((resolve, reject) => {
      Object.defineProperty(this, '_server', {
        value: new _net.Server()
      });
      // this._server = new NetServer()
      this._server.listen((0, _xtend2.default)({
        port: 7654
      }, serverConfig));

      this._server.on('listening', resolve);

      const getConnId = function () {
        let n = 0;
        return () => ++n % 0xffff;
      }();

      this._server.on('connection', getSocketHandler(getConnId, this));
      this._server.on('error', err => this.log.error(err));
      this._server.on('close', () => this.log.info('Underlying TCP server closing'));
    });
  }
}
exports.default = TcpServer;