import {Server as NetServer} from 'net'
import xtend from 'xtend'
import BaseServer from './base_server'

function getSocketHandler (getId, ixpServer) {
  return function (socket) {
    const id = getId()
    ixpServer.log.info('Received connection: #[%d]', id)

    // re: WIRE_FORMAT
    // cf. https://nodejs.org/api/stream.html#stream_readable_setencoding_encoding
    // cf. https://nodejs.org/api/net.html#net_socket_setencoding_encoding
    socket.setEncoding(ixpServer.codec.dataTransferEncoding)

    socket.on('data', (data) => {
      ixpServer.log.debug('Received data: #[%d]', id)
      ixpServer.dispatch(data).then(rpacket => {
        ixpServer.log.debug('Sending data: #[%d]', id)
        socket.write(rpacket)
      })
    })

    socket.on('end', () => {
      ixpServer.log.debug('Socket ended: #[%d]', id)
    })

    socket.on('close', () => {
      ixpServer.log.info('Socket closed: #[%d]', id)
    })
  }
}

export default class TcpServer extends BaseServer {
  listen (serverConfig) {
    return new Promise((resolve, reject) => {
      Object.defineProperty(this, '_server', {
        value: new NetServer()
      })
      // this._server = new NetServer()
      this._server.listen(xtend({
        port: 7654
      }, serverConfig))

      this._server.on('listening', resolve)

      const getConnId = (function () {
        let n = 0
        return () => ++n % 0xffff
      }())

      this._server.on('connection', getSocketHandler(getConnId, this))
      this._server.on('error', (err) => this.log.error(err))
      this._server.on('close',
                      () => this.log.info('Underlying TCP server closing'))
    })
  }
}
