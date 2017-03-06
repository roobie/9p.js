import assert from 'assert'
import {Qid as QidStruct} from '../structs'

export default class Qid {
  constructor (type, version, path) {
    assert(typeof type === 'number', 'type must be a number')
    assert(typeof version === 'number', 'version must be a number')
    assert(typeof path === 'number', 'path must be a number')

    Object.defineProperties(this, {
      type: {value: type},
      version: {value: version},
      path: {value: path}
    })
  }

  equals (otherQid) {
    return this.valueOf() === otherQid.valueOf()
  }

  toBuffer () {
    return QidStruct(this).buffer()
  }

  toString () {
    return `${this.type.toString(16)}:${this.version}:${this.path}`
  }

  valueOf () {
    return this.toBuffer().toString('hex')
  }

  toJSON () {
    return this
  }
}
