
/**
 * USAGE:
 * % node --inspect --debug-brk debug.js
 */

const packetType = require('./lib.es5/protocol_data').packetType
const MemoryFileSystem = require('./lib.es5/fs_memory').default

class TestAuthSvc {
  authenticate ({uname, file}) {
    return new Promise((resolve, reject) => {
      const adata = file.data.toString('utf8')
      if (uname === username && adata.indexOf(password) === 0) {
        return resolve()
      }

      return reject(new Error('wrong authentication data'))
    })
  }
}
var fs = new MemoryFileSystem({
  authenticationService: new TestAuthSvc()
})

fs.Tauth({
  type: packetType.Tauth,
  tag: 1000,
  afid: 1000,
  uname: 'a',
  aname: 'a'
})

debugger
