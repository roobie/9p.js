/*
 This module will start a TCP server listening on localhost:7654
 Try it by e.g. using netcat:

 # In one terminal do:
 $ node demonstration.js

 # In another terminal do:
 $ echo -e '{"type":100, "tag":1000, "msize":-1,"version":"9P2000"}' | nc localhost 7654

 */
const TcpServer = require('../lib.es5/tcp_server').default
const MemoryFileSystem = require('../lib.es5/fs_memory').default
const jsonCodec = require('../lib.es5/codecs/json')
const Log = require('log')

const server = new TcpServer({
  FsImplementation: MemoryFileSystem,
  codec: jsonCodec,
  log: new Log('debug')
})

server.listen(7654)
