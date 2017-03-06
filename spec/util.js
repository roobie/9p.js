const range = require('../lib.es5/util').default.range
const protocolData = require('../lib.es5/protocol_data')
const packetType = protocolData.packetType

const random = {
  bit: () => Math.random() < 0.5 ? 1 : 0,
  fid: () => parseInt(range(0, 32).map(() => random.bit()).join(''), 2)
}
module.exports.random = random

module.exports.maybeFail = function (t, rpkt) {
  if (rpkt.ename || rpkt.type === packetType.Rerror) {
    t.fail(rpkt.ename)
  }
  return rpkt
}

const tap = require('tap')
const test = tap.test

test('random.bit', t => {
  const b = random.bit()
  t.ok(b === 0 || b === 1)
  t.end()
})
