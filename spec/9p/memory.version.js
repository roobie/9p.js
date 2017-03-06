
const tap = require('tap')
const test = tap.test
const constants = require('../../lib.es5/constants.js')
const packetType = require('../../lib.es5/protocol_data').packetType
const MemoryFileSystem = require('../../lib.es5/fs_memory').default

const tag = 432345
test('T/R version, OK version', t => {
  const fs = new MemoryFileSystem()

  return fs.Tversion({
    type: packetType.Tversion,
    tag: tag,
    msize: -1,
    version: constants.VERSION9P
  })
    .then(rpkt => {
      t.equals(rpkt.type, packetType.Rversion)
      t.equals(rpkt.version, constants.VERSION9P)
      t.equals(rpkt.tag, tag)
    })
})

test('T/R version, Bad version', t => {
  const fs = new MemoryFileSystem()

  return fs.Tversion({
    type: packetType.Tversion,
    tag: tag,
    msize: -1,
    version: 'gibberish'
  })
    .then(null, err => {
      t.ok(err.message)
      t.equals(err.tag, tag)
    })
})
