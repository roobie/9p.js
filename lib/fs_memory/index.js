import assert from 'assert'
import Log from 'log'
import {IxpTaggedError} from '../errors'
import {octal} from '../util'
import Fid from './fid'
import {
  VERSION9P,

  DMDIR,
  DMREAD,
  DMWRITE,
  DMEXEC
} from '../constants'
import {packetType} from '../protocol_data'
import File from './file.js'
import {USER_ROOT, GROUP_WHEEL} from './user'
import {Just} from 'data.maybe'

function A () {}
A.checkPacketBase = (packet, expextedType) => {
  assert(packet.type === expextedType, `Wrong packet type, ${packet.type} !== ${expextedType}`)
  assert(packet.tag, 'packet.tag must be something')
}

export default class MemoryFileSystem {
  constructor ({log, authenticationService} = {}) {
    this.tree = File.mkroot()
    this.fids = []
    this.fid2afid = []
    this.log = log || new Log('info')
    this.authenticationService = authenticationService || null
  }

  Tversion (packet) {
    A.checkPacketBase(packet, packetType.Tversion)

    return new Promise((resolve, reject) => {
      if (packet.version !== VERSION9P) {
        return reject(new IxpTaggedError(packet.tag, 'Protocol version mismatch.'))
      }

      return resolve({
        tag: packet.tag,
        type: packetType.Rversion,
        msize: VERSION9P.length,
        version: VERSION9P
      })
    })
  }

  Tauth (packet) {
    /**
     * size[4] Tauth tag[2] afid[4] uname[s] aname[s]
     */
    A.checkPacketBase(packet, packetType.Tauth)
    if (this.authenticationService) {
      assert(packet.afid, 'afid must be defined')
      assert(packet.uname, 'uname must be defined')
      assert(packet.aname, 'aname must be defined')
    }

    return new Promise((resolve, reject) => {
      /*
       * TODO: how to implement authentication?
       * Is it a responsibility if this class? Hardly. Some other service
       * should supply the actual authentication
       * Maybe sodium.js?

       * From 9p man (5) intro
       Permission to attach to the service is proven by providing a
       special fid, called afid, in the attach message.  This afid
       is established by exchanging auth messages and subsequently
       manipulated using read and write messages to exchange
       authentication information not defined explicitly by 9P.
       Once the authentication protocol is complete, the afid is
       presented in the attach to permit the user to access the
       service.

       * Also:
       The file mode contains some additional attributes besides
       the permissions.  If bit 31 (DMDIR) is set, the file is a
       directory; if bit 30 (DMAPPEND) is set, the file is append-
       only (offset is ignored in writes); if bit 29 (DMEXCL) is
       set, the file is exclusive-use (only one client may have it
       open at a time); if bit 27 (DMAUTH) is set, the file is an
       authentication file established by auth messages; if bit 26
       (DMTMP) is set, the contents of the file (or directory) are
       not included in nightly archives.  (Bit 28 is skipped for
       historical reasons.)  These bits are reproduced, from the
       top bit down, in the type byte of the Qid: QTDIR, QTAPPEND,
       QTEXCL, (skipping one bit) QTAUTH, and QTTMP.  The name
       QTFILE, defined to be zero, identifies the value of the type
       for a plain file.
       */

      if (this.authenticationService) {
        const authDirName = '/authentication'
        let authDirM = this.tree.lookup(authDirName)
              .orElse(() => this.tree.mkdir(authDirName, octal('0700'), {
                uid: USER_ROOT,
                gid: GROUP_WHEEL
              }))
        const aqidM = authDirM
                .chain(dir => dir.mkauthfile(packet.aname))
                .map(afile => {
                  this.fids[packet.afid] = new Fid({
                    file: afile,
                    mode: 0,
                    user: packet.uname
                  })
                  return afile.qid
                })
        if (aqidM.isJust) {
          return resolve({
            tag: packet.tag,
            aqid: aqidM.get()
          })
        } else {
          return reject(new IxpTaggedError(
            packet.tag, 'Unable to create afid'))
        }
      }

      return reject(new IxpTaggedError(packet.tag, 'No authentication required.'))
    })
  }

  Tattach (packet) {
    /**
     * size[4] Tattach tag[2] fid[4] afid[4] uname[s] aname[s]
     */
    A.checkPacketBase(packet, packetType.Tattach)
    assert(packet.fid, 'fid must be defined')
    if (this.authenticationService) {
      assert(packet.afid, 'afid must be defined')
      assert(packet.uname, 'uname must be defined')
      assert(packet.aname, 'aname must be defined')
    }

    return new Promise((resolve, reject) => {
      if (this.fids[packet.fid]) {
        return reject(new IxpTaggedError(packet.tag, 'The fid is already in use.'))
      }

      return resolve()
    }).then(() => {
      const continuation = (maybeAfid) => () => {
        this.fids[packet.fid] = new Fid({file: this.tree, mode: 0})
        if (maybeAfid) {
          this.fid2afid[packet.fid] = maybeAfid
        }
        return {
          type: packetType.Rattach,
          tag: packet.tag,
          qid: this.fids[packet.fid].file.qid
        }
      }

      if (this.authenticationService) {
        if (!this.fids[packet.afid]) {
          throw new IxpTaggedError(packet.tag, 'The afid does not exist.')
        }

        return this.authenticationService.authenticate({
          uname: packet.uname,
          file: this.fids[packet.afid].file
        })
          .then(
            continuation(packet.afid),
            (error) => {
              throw new IxpTaggedError(
                packet.tag, `Could not authenticate: ${error.message}`)
            })
      }

      return continuation(null)()
    })
  }

  Twalk (packet) {
    A.checkPacketBase(packet, packetType.Twalk)

    // cf. https://swtch.com/plan9port/man/man9/walk.html
    return new Promise((resolve, reject) => {
      if (!this.fids[packet.fid]) {
        return reject(new IxpTaggedError(
          packet.tag, 'The fid is not in use. Invoke `attach` first.'))
      }

      if (packet.newfid !== packet.fid && this.fids[packet.newfid]) {
        return reject(new IxpTaggedError(packet.tag, 'The fid is already in use.'))
      }

      // if number of wnames is zero, we copy the reference to the fid
      // to newfid, but do nothing else
      if (packet.nwname < 1) {
        this.fids[packet.newfid] = this.fids[packet.fid].clone()
        return resolve({
          type: packetType.Rwalk,
          tag: packet.tag,
          nwqid: 0,
          wqid: []
        })
      }

      const node = this.fids[packet.fid]
      const {file} = node

      const startFileM = file.lookup(packet.wname[0])
      const startIsDirM = startFileM
              .map(file => file.isDir())
      if (startIsDirM.isNothing) {
        return reject(new IxpTaggedError(
          packet.tag,
          `The file=${packet.wname[0]} does not exist`))
      }
      if (!startIsDirM.getOrElse(false)) {
        return reject(new IxpTaggedError(
          packet.tag,
          `The file=${packet.wname[0]} is not a directory.`))
      }

      const wqids = []
      let newFileM = Just(file)
      for (let n = 0;
           newFileM.isJust && n < packet.nwname;
           ++n) {
        newFileM = newFileM.chain(f => {
          return f.lookup(packet.wname[n])
            .map(foundFile => {
              wqids.push(foundFile.qid)
              return foundFile
            })
        })
      }

      if (wqids.length === packet.nwname) {
        this.fids[packet.newfid] = new Fid({file: newFileM.get(), mode: 0})
      }

      return resolve({
        type: packetType.Rwalk,
        tag: packet.tag,
        nwqid: wqids.length,
        wqid: wqids
      })
    })
  }

  Topen (packet) {
    return new Promise((resolve, reject) => {
      if (!this.fids[packet.fid]) {
        return reject(new IxpTaggedError(
          packet.tag, 'The fid is not in use. Invoke `attach` first.'))
      }
      const node = this.fids[packet.fid]
      const {file, mode} = node

      const [deny, reason] = mustDenyAccess(file, packet.mode)
      if (deny) {
        return reject(new IxpTaggedError(packet.tag, reason))
      }

      if (file.isFile() && (mode & DMWRITE) && file.isExclusive()) {
        return reject(new IxpTaggedError(packet.tag, 'This file is already open'))
      } else if (file.isDir()) {
        file.bloc = file.nloc = 0
      }

      node.mode = packet.mode

      return resolve({
        type: packetType.Ropen,
        tag: packet.tag,
        qid: file.qid,
        iounit: 0
      })
    })
  }

  Tcreate (packet) {
    A.checkPacketBase(packet, packetType.Tcreate)
    assert(packet.tag, 'tag')
    assert(packet.fid, 'fid')
    assert(packet.name, 'name')
    assert(packet.name !== '.', 'name must not be "."')
    assert(packet.name !== '..', 'name must not be ".."')
    assert(typeof packet.perm !== 'undefined', 'perm')
    assert(typeof packet.mode !== 'undefined', 'mode')

    return new Promise((resolve, reject) => {
      if (!this.fids[packet.fid]) {
        return reject(new IxpTaggedError(
          packet.tag, 'The fid is not in use. Invoke `attach` first.'))
      }

      const node = this.fids[packet.fid]
      const {file} = node

      if (!file.isDir()) {
        return reject(new IxpTaggedError(
          packet.tag, 'Cannot create a file in a file.'))
      }

      let newFileM
      if (DMDIR & packet.perm) { // possibly (packet.perm - DMDIR) >= 0
        newFileM = file.mkdir(packet.name)
      } else {
        newFileM = file.mkfile(packet.name)
      }
      if (newFileM.isNothing) {
        throw new TypeError(`Something went horribly wrong.
The file for fid=${packet.fid} could not create a file`)
      }

      const newFile = newFileM.get()
      this.fids[packet.fid] = new Fid({file: newFile, mode: packet.mode})

      node.mode = file.mode = packet.mode
      return resolve({
        type: packetType.Ropen,
        tag: packet.tag,
        qid: newFile.qid,
        iounit: 0
      })
    })
  }

  Tread (packet) {
    A.checkPacketBase(packet, packetType.Tcreate)
    assert(packet.fid, 'fid')
    assert(typeof packet.offset !== 'undefined', 'offset')
    assert(packet.count, 'count') // count == 0 is bad, I think

    return new Promise((resolve, reject) => {
      const node = this.fids[packet.fid]
      if (!node) {
        return reject(new IxpTaggedError(
          packet.tag, 'The fid is not in use. Invoke `attach` first.'))
      }

      const {file, mode} = node
      if (!(mode & DMREAD)) {
        return reject(new IxpTaggedError(
          packet.tag, 'The fid is not open for reads. Use Topen first'))
      }

      if (!file.isReadable()) {
        return reject(new IxpTaggedError(
          packet.tag, `The ${file.isDir() ? 'directory' : 'file'} is not readable`))
      }
      if (file.isDir()) {
        if (!file.isExecable()) {
          return reject(new IxpTaggedError(packet.tag, 'The directory is not executable'))
        }

        return readDir(this, packet, node)
      }

      const data = file.read(packet.offset, packet.count)
      return resolve({
        type: packetType.Rread,
        tag: packet.tag,
        count: data.length,
        data: data
      })
    })
  }

  Twrite (packet) {
    assert(packet.fid, 'fid must be defined')
    return new Promise((resolve, reject) => {
      const node = this.fids[packet.fid]
      if (!node) {
        return reject(new IxpTaggedError(packet.tag, 'no such fid'))
      }
      const {file, mode} = node
      if (!(mode & DMWRITE)) {
        return reject(new IxpTaggedError(packet.tag, 'fid is not open for write'))
      }
      if (file.isDir()) {
        return reject(new IxpTaggedError(
          packet.tag, 'not possible to write to a directory'))
      }

      file.write(packet.offset, packet.count, packet.data)
      return resolve({
        type: packetType.Rwrite,
        tag: packet.tag,
        count: packet.count
      })
    })
  }

  Tclunk (packet) {
    return new Promise((resolve, reject) => {
      if (!this.fids[packet.fid]) {
        return reject(new IxpTaggedError(packet.tag, 'no such fid'))
      }

      delete this.fids[packet.fid]
      delete this.fid2afid[packet.fid]
      return resolve({type: packetType.Rclunk, tag: packet.tag})
    })
  }

  Tremove (packet) {
    throw new Error('not implemented')
  }

  Tstat (packet) {
    throw new Error('not implemented')
  }

  Twstat (packet) {
    throw new Error('not implemented')
  }
}

function mustDenyAccess (file, mode) {
  // TODO: make better
  if (file.isDir()) {
    if (mode & DMWRITE) {
      return [true, 'directories are read only']
    }
    if (mode & DMEXEC) {
      return [false]
    }
    return [true, 'Directories are executed to list contents']
  }

  if (mode & DMEXEC) {
    return [true, 'OEXEC not allowed']
  }
  if (!!(mode & DMWRITE) && !file.isWritable()) {
    return [true, 'file is read only']
  }
  if (!(mode & DMREAD) && !(mode & DMWRITE)) {
    return [true, 'only read ']
  }

  return [false]
}

function readDir (service, packet, file) {
  return new Promise((resolve, reject) => {
    const reply = {
      type: packetType.Rread,
      tag: packet.tag
    }
    if (packet.offset === 0) {
      file.bloc = file.nloc = 0
    }

    if (packet.offset !== file.bloc) {
      return reject(new IxpTaggedError(
        packet.tag, `Seek in a directory is illegal!
packet.offset(${packet.offset}) != ${file.bloc}`))
    }

    reply.length = 4 // 32 bit int
    reply.data = file.nchildren.length
    resolve(reply)
  })
}
