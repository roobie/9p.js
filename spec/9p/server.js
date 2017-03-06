
const tap = require('tap')
const test = tap.test

const packetType = require('../../lib.es5/protocol_data').packetType
const constants = require('../../lib.es5/constants.js')

const util = require('../util')
const random = util.random
const maybeFail = util.maybeFail

const testHelpers = require('./test_helpers.js')

// ================================================================
const tag = 1999

const srv = testHelpers.getServer()

test('answer should reject a promise if the type is invalid', t => {
  return srv.dispatch({type: 99, tag: tag})
    .then((packet) => {
      t.equals(packet.type, packetType.Rerror)
      t.equals(packet.tag, tag)
      t.ok(/not implemented/i.test(packet.ename))
    })
})

test('T/R version', t => {
  // since we're using noopCodec, the msize is irrelevant
  return srv.dispatch({
    type: packetType.Tversion,
    tag: tag,
    msize: -1,
    version: constants.VERSION9P
  })
    .then(rpkt => {
      maybeFail(t, rpkt)
      t.ok(rpkt)
      t.equals(rpkt.type, packetType.Rversion)
      t.equals(rpkt.tag, tag)
    })
    .then(() => {
      // wrong version
      return srv.dispatch({
        type: 100,
        tag: tag,
        msize: -1,
        version: 'gibberish'
      })
    })
    .then(packet => {
      t.equals(packet.type, packetType.Rerror)
      t.equals(packet.tag, tag)
      t.ok(/protocol version mismatch/i.test(packet.ename))
    })
})

test('T/R auth', t => {
  const afid = random.fid()

  return srv.dispatch({
    type: packetType.Tauth,
    tag: tag,
    afid: afid,
    uname: 'tester',
    aname: 'tester'
  })
    .then(rpkt => {
      t.ok(rpkt)
      t.equals(rpkt.type, packetType.Rerror)
      t.equals(rpkt.tag, tag)
    })
})

test('T/R attach', t => {
  const fid = random.fid()
  const afid = random.fid()

  return srv.dispatch({
    type: packetType.Tattach,
    tag: tag,
    fid: fid,
    afid: afid,
    uname: 'tester',
    aname: 'tester'
  })
    .then(rpkt => {
      maybeFail(t, rpkt)
      t.ok(rpkt)
      t.equals(rpkt.type, packetType.Rattach)
      t.equals(rpkt.tag, tag)
    })
})

test('T/R walk', t => {
  const fid = random.fid()
  const afid = random.fid()
  const newfid = random.fid()
  const newfid2 = random.fid()

  return srv.dispatch({
    type: packetType.Tattach,
    tag: tag,
    fid: fid,
    afid: afid,
    uname: 'tester',
    aname: 'tester'
  })
    .then((rpkt) => {
      maybeFail(t, rpkt)
      t.equals(rpkt.type, packetType.Rattach)

      return srv.dispatch({
        type: packetType.Twalk,
        tag: tag,
        fid: fid,
        newfid: newfid,
        nwname: 0,
        wname: []
      })
    })
    .then(rpkt => {
      maybeFail(t, rpkt)
      t.ok(rpkt)
      t.equals(rpkt.type, packetType.Rwalk)
      t.equals(rpkt.tag, tag)
      t.equals(rpkt.nwqid, 0) // we sent nwname=0, so nwqid should be 0

      // shimmy in some dirs
      const root = srv.implementation.tree
      root.mkdir('/a')
      root.mkdir('/a/b')
    })
    .then(() => {
      return srv.dispatch({
        type: packetType.Twalk,
        tag: tag,
        fid: fid,
        newfid: newfid2,
        nwname: 3,
        wname: ['/', 'a', 'b']
      })
    })
    .then(rpkt => {
      maybeFail(t, rpkt)
      t.ok(rpkt)
      t.equals(rpkt.type, packetType.Rwalk)
      t.equals(rpkt.tag, tag)
      t.equals(rpkt.nwqid, 3)
    })
})

test('T/R open', t => {
  const afid = random.fid()
  const fid = random.fid()

  return srv.dispatch({
    type: packetType.Tattach,
    tag: tag,
    afid: afid,
    fid: fid,
    uname: 'tester',
    aname: 'tester'
  })
    .then(testRattach(t))
    .then(() => {
      return srv.dispatch({
        type: packetType.Topen,
        tag: tag,
        fid: fid,
        mode: constants.DMREAD | constants.DMEXEC
      })
    })
    .then((rpkt) => {
      maybeFail(t, rpkt)

      // this is OK, because the file does not have DMEXCL
      return srv.dispatch({
        type: packetType.Topen,
        tag: tag,
        fid: fid,
        mode: constants.DMREAD | constants.DMEXEC
      })
    })
    .then((rpkt) => {
      maybeFail(t, rpkt)
      const newfid = random.fid()
      const root = srv.implementation.tree
      root.mkdir('/d')
      root.mkfile('/d/a.txt')

      return srv.dispatch({
        type: packetType.Twalk,
        tag: tag,
        fid: fid,
        newfid: newfid,
        nwname: 3,
        wname: ['/', 'd', 'a.txt']
      })
        .then((rpkt) => {
          maybeFail(t, rpkt)
          t.equals(rpkt.nwqid, 3)
          t.equals(rpkt.wqid.length, 3)

          const [fst, snd, trd] = rpkt.wqid
          t.equals(fst.type, constants.QTDIR)
          t.equals(snd.type, constants.QTDIR)
          t.equals(trd.type, constants.QTFILE)

          return srv.dispatch({
            type: packetType.Topen,
            tag: tag,
            fid: newfid,
            mode: constants.DMREAD
          })
            .then((rpkt) => {
              maybeFail(t, rpkt)

              const ifid = srv.implementation.fids[newfid]
              t.ok(ifid.mode & constants.DMREAD)
            })
        })
    })
    .then((rpkt) => {
      maybeFail(t, rpkt || {})
    })
})

test('T/R X', t => {
  const afid = random.fid()
  const fid = random.fid()

  return srv.dispatch({
    type: packetType.Tattach,
    tag: tag,
    afid: afid,
    fid: fid,
    uname: 'tester',
    aname: 'tester'
  })
    .then(testRattach(t))
})

function testRattach (t) {
  return function (rpkt) {
    maybeFail(t, rpkt)
    t.ok(rpkt)
    t.equals(rpkt.type, packetType.Rattach)
    t.equals(rpkt.tag, tag)
  }
}
