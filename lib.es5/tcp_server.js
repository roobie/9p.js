'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _net = require('net');

var _xtend = require('xtend');

var _xtend2 = _interopRequireDefault(_xtend);

var _base_server = require('./base_server');

var _base_server2 = _interopRequireDefault(_base_server);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function getSocketHandler(getId, ixpServer) {
  return function (socket) {
    var id = getId();
    ixpServer.log.info('Received connection: #[%d]', id);

    // re: WIRE_FORMAT
    // cf. https://nodejs.org/api/stream.html#stream_readable_setencoding_encoding
    // cf. https://nodejs.org/api/net.html#net_socket_setencoding_encoding
    socket.setEncoding(ixpServer.codec.dataTransferEncoding);

    socket.on('data', function (data) {
      ixpServer.log.debug('Received data: #[%d]', id);
      ixpServer.dispatch(data).then(function (rpacket) {
        ixpServer.log.debug('Sending data: #[%d]', id);
        socket.write(rpacket);
      });
    });

    socket.on('end', function () {
      ixpServer.log.debug('Socket ended: #[%d]', id);
    });

    socket.on('close', function () {
      ixpServer.log.info('Socket closed: #[%d]', id);
    });
  };
}

var TcpServer = function (_BaseServer) {
  _inherits(TcpServer, _BaseServer);

  function TcpServer() {
    _classCallCheck(this, TcpServer);

    return _possibleConstructorReturn(this, (TcpServer.__proto__ || Object.getPrototypeOf(TcpServer)).apply(this, arguments));
  }

  _createClass(TcpServer, [{
    key: 'listen',
    value: function listen(serverConfig) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        Object.defineProperty(_this2, '_server', {
          value: new _net.Server()
        });
        // this._server = new NetServer()
        _this2._server.listen((0, _xtend2.default)({
          port: 7654
        }, serverConfig));

        _this2._server.on('listening', resolve);

        var getConnId = function () {
          var n = 0;
          return function () {
            return ++n % 0xffff;
          };
        }();

        _this2._server.on('connection', getSocketHandler(getConnId, _this2));
        _this2._server.on('error', function (err) {
          return _this2.log.error(err);
        });
        _this2._server.on('close', function () {
          return _this2.log.info('Underlying TCP server closing');
        });
      });
    }
  }]);

  return TcpServer;
}(_base_server2.default);

exports.default = TcpServer;