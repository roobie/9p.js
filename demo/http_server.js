/*
 This module will start a HTTP server listening on localhost:7654

 test it with cUrl
 $ echo -e '{"type":100, "tag":1000, "msize":-1,"version":"9P2000"}' | curl -d @- http://localhost:7654  --header "Content-Type:application/json"

 */
const HttpServer = require('../lib.es5/http_server').default
const MemoryFileSystem = require('../lib.es5/fs_memory').default
//const jsonCodec = require('../lib.es5/codecs/json')
const noopCodec = require('../lib.es5/codecs/noop')
const Log = require('log')

const express = require('express')
const bodyParser = require('body-parser')

const log = new Log('debug')
const server = new HttpServer({
  FsImplementation: MemoryFileSystem,
  codec: noopCodec,
  log: log
})

const app = express()
app.use(bodyParser.json())
app.post('/', server.handle.bind(server))

app.listen(7654, () => {
  log.info('Server started')
})
