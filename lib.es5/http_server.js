'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _base_server = require('./base_server');

var _base_server2 = _interopRequireDefault(_base_server);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var HttpServer = function (_BaseServer) {
  _inherits(HttpServer, _BaseServer);

  function HttpServer() {
    _classCallCheck(this, HttpServer);

    return _possibleConstructorReturn(this, (HttpServer.__proto__ || Object.getPrototypeOf(HttpServer)).apply(this, arguments));
  }

  _createClass(HttpServer, [{
    key: 'handle',

    /**
     * Requires the use of:
     * <pre>
     * var bodyParser = require('body-parser')
     * app.use(bodyParser.json()); // to support JSON-encoded bodies
     * </pre>
     */
    value: function handle(req, res) {
      var _this2 = this;

      this.dispatch(req.body).then(function (rpacket) {
        if (_this2.codec.httpContentType) {
          res.setHeader('Content-Type', _this2.codec.httpContentType);
        }
        res.send(rpacket);
      });
    }
  }]);

  return HttpServer;
}(_base_server2.default);

exports.default = HttpServer;