
const tap = require('tap')
const test = tap.test

const BaseServer = require('../../lib.es5/base_server').default
const MemoryFileSystem = require('../../lib.es5/fs_memory').default
const noopCodec = require('../../lib.es5/codecs/noop')
const Log = require('log')
const log = new Log('critical')

module.exports.log = log
module.exports.getServer = function () {
  return new BaseServer({
    FsImplementation: MemoryFileSystem,
    codec: noopCodec,
    log: log
  })
}

test('basic', t => {
  t.ok(log)
  t.end()
})
