import BaseServer from './base_server'

export default class HttpServer extends BaseServer {
  /**
   * Requires the use of:
   * <pre>
   * var bodyParser = require('body-parser')
   * app.use(bodyParser.json()); // to support JSON-encoded bodies
   * </pre>
   */
  handle (req, res) {
    this.dispatch(req.body).then(rpacket => {
      if (this.codec.httpContentType) {
        res.setHeader('Content-Type', this.codec.httpContentType)
      }
      res.send(rpacket)
    })
  }
}
