
const tap = require('tap')
const test = tap.test

const Buffer = require('buffer').Buffer
const codec = require('../../lib.es5/codecs/ixp')

test('Tversion', t => {
  test('decode', t => {
    const pkt = {
      size: 16,
      type: 100,
      tag: 123,
      msize: 5,
      version: 'hello'
    }

    const binData = [
    // ------size|type|----tag|------msize|-----------------version
      16, 0, 0, 0, 100, 123, 0, 5, 0, 0, 0, 104, 101, 108, 108, 111
    ]

    const result = codec.decode(Buffer(binData))

    t.ok(result)
    t.deepEqual(result, pkt)

    t.end()
  })

  test('encode', t => {
    const pkt = {
      size: 16,
      type: 101,
      tag: 123,
      msize: 5,
      version: 'hello'
    }

    const binData = [
      16, 0, 0, 0, 101, 123, 0, 5, 0, 0, 0, 104, 101, 108, 108, 111
    ]

    const result = codec.encode(pkt)

    t.ok(result)
    t.deepEqual(result, Buffer(binData))

    t.end()
  })

  t.end()
})
