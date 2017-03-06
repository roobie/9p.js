
const tap = require('tap')
const test = tap.test
const Promise = require('bluebird')
const packetType = require('../../lib.es5/protocol_data').packetType
const MemoryFileSystem = require('../../lib.es5/fs_memory').default
const constants = require('../../lib.es5/constants.js')
const random = require('../util').random

const username = 'testuser'
const password = 'testpassword'

class TestAuthSvc {
  authenticate ({uname, file}) {
    return new Promise((resolve, reject) => {
      const adata = file.readToEnd().toString('utf8')

      if (uname === username && adata.indexOf(password) === 0) {
        return resolve()
      }

      return reject(new Error('wrong authentication data'))
    })
  }
}

const tag = 432345
test('T/R auth', t => {
  const fs = new MemoryFileSystem()

  const afid = random.fid()

  return fs.Tauth({
    type: packetType.Tauth,
    tag: tag,
    afid: afid
  })
    .then(null, err => {
      t.ok(err.message)
      t.equals(err.tag, tag)
    })
})

test('T/R auth with auth', t => {
  const fs = new MemoryFileSystem({
    authenticationService: new TestAuthSvc()
  })

  const afid = random.fid()
  const aname = `${username}_auth`

  return fs.Tauth({
    type: packetType.Tauth,
    tag: tag,
    afid: afid,
    uname: username,
    aname: aname
  })
    .then(rpkt => {
      t.ok(rpkt)
      t.ok(rpkt.aqid)
    })
    .then(() => {
      return fs.Topen({
        type: packetType.Topen,
        tag: tag,
        fid: afid,
        mode: constants.DMWRITE
      })
    })
    .then(rpkt => {
      t.ok(rpkt)
    })
    .then(rpkt => {
      return fs.Twrite({
        type: packetType.Twrite,
        tag: tag,
        fid: afid,
        offset: 0,
        count: password.length,
        data: Buffer.from(password, 'utf8')
      })
    })
    .then(rpkt => {
      t.ok(rpkt)
    })
    .then(() => {
      const fid = random.fid()
      return fs.Tattach({
        type: packetType.Tattach,
        tag: tag,
        fid: fid,
        afid: afid,
        uname: username,
        aname: aname
      })
    })
    .then(rpkt => {
      t.ok(rpkt)
    })
    .catch(t.fail)
})
