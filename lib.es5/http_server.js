'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _base_server = require('./base_server');

var _base_server2 = _interopRequireDefault(_base_server);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class HttpServer extends _base_server2.default {
  /**
   * Requires the use of:
   * <pre>
   * var bodyParser = require('body-parser')
   * app.use(bodyParser.json()); // to support JSON-encoded bodies
   * </pre>
   */
  handle(req, res) {
    this.dispatch(req.body).then(rpacket => {
      if (this.codec.httpContentType) {
        res.setHeader('Content-Type', this.codec.httpContentType);
      }
      res.send(rpacket);
    });
  }
}
exports.default = HttpServer;