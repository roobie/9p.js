'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _protocol_data = require('./protocol_data');

var _log = require('log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BaseServer = function () {
  function BaseServer(_ref) {
    var FsImplementation = _ref.FsImplementation,
        authenticationService = _ref.authenticationService,
        codec = _ref.codec,
        log = _ref.log;

    _classCallCheck(this, BaseServer);

    // this.authenticationService = authenticationService
    this.implementation = new FsImplementation({
      authenticationService: authenticationService,
      log: log
    });
    this.codec = codec;

    this.log = log || new _log2.default('info');
  }

  _createClass(BaseServer, [{
    key: 'dispatch',
    value: function dispatch(data) {
      var _this = this;

      var tpacket = this.codec.decode(data);

      this.log.debug('Packet[RX]:', tpacket);

      if (!tpacket.tag) {
        var _errMsg = 'Packet must contain a tag';
        return this.error9p(tpacket.tag, _errMsg);
      }

      if (_protocol_data.packets[tpacket.type]) {
        var handlerName = _protocol_data.packets[tpacket.type];
        if (!handlerName) {
          var _errMsg2 = 'No handler found for [' + tpacket.type + ']. This is a bug.';
          this.log.critical(tpacket);
          return this.error9p(tpacket.tag, _errMsg2);
        }

        if (handlerName in this.implementation) {
          var response = void 0;

          try {
            response = this.implementation[handlerName](tpacket);
          } catch (e) {
            this.log.critical(e);
            var _errMsg3 = this.log.level === _log2.default.DEBUG ? e.message : 'Internal server error';

            return this.error9p(tpacket.tag, _errMsg3);
          }

          return response.then(function (rpacket) {
            return _this.send9p(rpacket);
          }, function (err) {
            _this.log.error(err);
            return _this.error9p(err.tag, err.message);
          });
        }
      }

      var errMsg = 'The type(' + tpacket.type + ') is not implemented.';
      this.log.debug('Error:', errMsg);
      return this.error9p(tpacket.tag, errMsg);
    }
  }, {
    key: 'error9p',
    value: function error9p(tag, msg) {
      var _this2 = this;

      return new _bluebird2.default(function (resolve) {
        var rpacket = { type: _protocol_data.packetType.Rerror, tag: tag, ename: msg };
        var data = _this2.codec.encode(rpacket);

        _this2.log.debug('Packet[TX]:', data);
        resolve(data);
      });
    }
  }, {
    key: 'send9p',
    value: function send9p(rpacket) {
      var _this3 = this;

      // we could add validation here.
      return new _bluebird2.default(function (resolve) {
        var data = _this3.codec.encode(rpacket);

        _this3.log.debug('Packet[TX]:', data);
        resolve(data);
      });
    }
  }]);

  return BaseServer;
}();

exports.default = BaseServer;