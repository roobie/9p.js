import assert from 'assert'
import {octal} from '../util'
import {USER_DEFAULT} from './user'
import File from './file.js'

export default class Fid {
  constructor ({file, mode, user}) { // TODO : how to get current user from OS??
    assert(file instanceof File, '`file` must be a `File`')
    assert(typeof mode === 'number', 'mode must be a number')
    assert(mode >= 0 && mode <= octal('0777'), 'mode must be between (0..0xfff]')

    Object.defineProperties(this, {
      file: {value: file},
      user: {value: user || USER_DEFAULT}
    })

    this.mode = mode
  }

  clone () {
    return new Fid({file: this.file, mode: this.mode, user: this.user})
  }
}
