import Promise from 'bluebird'
import {packets, packetType} from './protocol_data'
import Log from 'log'

export default class BaseServer {
  constructor ({
    FsImplementation,
    authenticationService,
    codec,
    log
  }) {
    // this.authenticationService = authenticationService
    this.implementation = new FsImplementation({
      authenticationService,
      log
    })
    this.codec = codec

    this.log = log || new Log('info')
  }

  dispatch (data) {
    const tpacket = this.codec.decode(data)

    this.log.debug('Packet[RX]:', tpacket)

    if (!tpacket.tag) {
      const errMsg = 'Packet must contain a tag'
      return this.error9p(tpacket.tag, errMsg)
    }

    if (packets[tpacket.type]) {
      const handlerName = packets[tpacket.type]
      if (!handlerName) {
        const errMsg = `No handler found for [${tpacket.type}]. This is a bug.`
        this.log.critical(tpacket)
        return this.error9p(tpacket.tag, errMsg)
      }

      if (handlerName in this.implementation) {
        let response

        try {
          response = this.implementation[handlerName](tpacket)
        } catch (e) {
          this.log.critical(e)
          const errMsg = this.log.level === Log.DEBUG
                  ? e.message : 'Internal server error'

          return this.error9p(tpacket.tag, errMsg)
        }

        return response.then(
          (rpacket) => this.send9p(rpacket),
          (err) => {
            this.log.error(err)
            return this.error9p(err.tag, err.message)
          })
      }
    }

    const errMsg = `The type(${tpacket.type}) is not implemented.`
    this.log.debug('Error:', errMsg)
    return this.error9p(tpacket.tag, errMsg)
  }

  error9p (tag, msg) {
    return new Promise((resolve) => {
      const rpacket = {type: packetType.Rerror, tag: tag, ename: msg}
      const data = this.codec.encode(rpacket)

      this.log.debug('Packet[TX]:', data)
      resolve(data)
    })
  }

  send9p (rpacket) {
    // we could add validation here.
    return new Promise((resolve) => {
      const data = this.codec.encode(rpacket)

      this.log.debug('Packet[TX]:', data)
      resolve(data)
    })
  }
}
