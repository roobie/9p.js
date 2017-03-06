'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _log = require('log');

var _log2 = _interopRequireDefault(_log);

var _errors = require('../errors');

var _util = require('../util');

var _fid = require('./fid');

var _fid2 = _interopRequireDefault(_fid);

var _constants = require('../constants');

var _protocol_data = require('../protocol_data');

var _file = require('./file.js');

var _file2 = _interopRequireDefault(_file);

var _user = require('./user');

var _data = require('data.maybe');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function A() {}
A.checkPacketBase = (packet, expextedType) => {
  (0, _assert2.default)(packet.type === expextedType, `Wrong packet type, ${packet.type} !== ${expextedType}`);
  (0, _assert2.default)(packet.tag, 'packet.tag must be something');
};

class MemoryFileSystem {
  constructor({ log, authenticationService } = {}) {
    this.tree = _file2.default.mkroot();
    this.fids = [];
    this.fid2afid = [];
    this.log = log || new _log2.default('info');
    this.authenticationService = authenticationService || null;
  }

  Tversion(packet) {
    A.checkPacketBase(packet, _protocol_data.packetType.Tversion);

    return new Promise((resolve, reject) => {
      if (packet.version !== _constants.VERSION9P) {
        return reject(new _errors.IxpTaggedError(packet.tag, 'Protocol version mismatch.'));
      }

      return resolve({
        tag: packet.tag,
        type: _protocol_data.packetType.Rversion,
        msize: _constants.VERSION9P.length,
        version: _constants.VERSION9P
      });
    });
  }

  Tauth(packet) {
    /**
     * size[4] Tauth tag[2] afid[4] uname[s] aname[s]
     */
    A.checkPacketBase(packet, _protocol_data.packetType.Tauth);
    if (this.authenticationService) {
      (0, _assert2.default)(packet.afid, 'afid must be defined');
      (0, _assert2.default)(packet.uname, 'uname must be defined');
      (0, _assert2.default)(packet.aname, 'aname must be defined');
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
        const authDirName = '/authentication';
        let authDirM = this.tree.lookup(authDirName).orElse(() => this.tree.mkdir(authDirName, (0, _util.octal)('0700'), {
          uid: _user.USER_ROOT,
          gid: _user.GROUP_WHEEL
        }));
        const aqidM = authDirM.chain(dir => dir.mkauthfile(packet.aname)).map(afile => {
          this.fids[packet.afid] = new _fid2.default({
            file: afile,
            mode: 0,
            user: packet.uname
          });
          return afile.qid;
        });
        if (aqidM.isJust) {
          return resolve({
            tag: packet.tag,
            aqid: aqidM.get()
          });
        } else {
          return reject(new _errors.IxpTaggedError(packet.tag, 'Unable to create afid'));
        }
      }

      return reject(new _errors.IxpTaggedError(packet.tag, 'No authentication required.'));
    });
  }

  Tattach(packet) {
    /**
     * size[4] Tattach tag[2] fid[4] afid[4] uname[s] aname[s]
     */
    A.checkPacketBase(packet, _protocol_data.packetType.Tattach);
    (0, _assert2.default)(packet.fid, 'fid must be defined');
    if (this.authenticationService) {
      (0, _assert2.default)(packet.afid, 'afid must be defined');
      (0, _assert2.default)(packet.uname, 'uname must be defined');
      (0, _assert2.default)(packet.aname, 'aname must be defined');
    }

    return new Promise((resolve, reject) => {
      if (this.fids[packet.fid]) {
        return reject(new _errors.IxpTaggedError(packet.tag, 'The fid is already in use.'));
      }

      return resolve();
    }).then(() => {
      const continuation = maybeAfid => () => {
        this.fids[packet.fid] = new _fid2.default({ file: this.tree, mode: 0 });
        if (maybeAfid) {
          this.fid2afid[packet.fid] = maybeAfid;
        }
        return {
          type: _protocol_data.packetType.Rattach,
          tag: packet.tag,
          qid: this.fids[packet.fid].file.qid
        };
      };

      if (this.authenticationService) {
        if (!this.fids[packet.afid]) {
          throw new _errors.IxpTaggedError(packet.tag, 'The afid does not exist.');
        }

        return this.authenticationService.authenticate({
          uname: packet.uname,
          file: this.fids[packet.afid].file
        }).then(continuation(packet.afid), error => {
          throw new _errors.IxpTaggedError(packet.tag, `Could not authenticate: ${error.message}`);
        });
      }

      return continuation(null)();
    });
  }

  Twalk(packet) {
    A.checkPacketBase(packet, _protocol_data.packetType.Twalk);

    // cf. https://swtch.com/plan9port/man/man9/walk.html
    return new Promise((resolve, reject) => {
      if (!this.fids[packet.fid]) {
        return reject(new _errors.IxpTaggedError(packet.tag, 'The fid is not in use. Invoke `attach` first.'));
      }

      if (packet.newfid !== packet.fid && this.fids[packet.newfid]) {
        return reject(new _errors.IxpTaggedError(packet.tag, 'The fid is already in use.'));
      }

      // if number of wnames is zero, we copy the reference to the fid
      // to newfid, but do nothing else
      if (packet.nwname < 1) {
        this.fids[packet.newfid] = this.fids[packet.fid].clone();
        return resolve({
          type: _protocol_data.packetType.Rwalk,
          tag: packet.tag,
          nwqid: 0,
          wqid: []
        });
      }

      const node = this.fids[packet.fid];
      const { file } = node;

      const startFileM = file.lookup(packet.wname[0]);
      const startIsDirM = startFileM.map(file => file.isDir());
      if (startIsDirM.isNothing) {
        return reject(new _errors.IxpTaggedError(packet.tag, `The file=${packet.wname[0]} does not exist`));
      }
      if (!startIsDirM.getOrElse(false)) {
        return reject(new _errors.IxpTaggedError(packet.tag, `The file=${packet.wname[0]} is not a directory.`));
      }

      const wqids = [];
      let newFileM = (0, _data.Just)(file);
      for (let n = 0; newFileM.isJust && n < packet.nwname; ++n) {
        newFileM = newFileM.chain(f => {
          return f.lookup(packet.wname[n]).map(foundFile => {
            wqids.push(foundFile.qid);
            return foundFile;
          });
        });
      }

      if (wqids.length === packet.nwname) {
        this.fids[packet.newfid] = new _fid2.default({ file: newFileM.get(), mode: 0 });
      }

      return resolve({
        type: _protocol_data.packetType.Rwalk,
        tag: packet.tag,
        nwqid: wqids.length,
        wqid: wqids
      });
    });
  }

  Topen(packet) {
    return new Promise((resolve, reject) => {
      if (!this.fids[packet.fid]) {
        return reject(new _errors.IxpTaggedError(packet.tag, 'The fid is not in use. Invoke `attach` first.'));
      }
      const node = this.fids[packet.fid];
      const { file, mode } = node;

      const [deny, reason] = mustDenyAccess(file, packet.mode);
      if (deny) {
        return reject(new _errors.IxpTaggedError(packet.tag, reason));
      }

      if (file.isFile() && mode & _constants.DMWRITE && file.isExclusive()) {
        return reject(new _errors.IxpTaggedError(packet.tag, 'This file is already open'));
      } else if (file.isDir()) {
        file.bloc = file.nloc = 0;
      }

      node.mode = packet.mode;

      return resolve({
        type: _protocol_data.packetType.Ropen,
        tag: packet.tag,
        qid: file.qid,
        iounit: 0
      });
    });
  }

  Tcreate(packet) {
    A.checkPacketBase(packet, _protocol_data.packetType.Tcreate);
    (0, _assert2.default)(packet.tag, 'tag');
    (0, _assert2.default)(packet.fid, 'fid');
    (0, _assert2.default)(packet.name, 'name');
    (0, _assert2.default)(packet.name !== '.', 'name must not be "."');
    (0, _assert2.default)(packet.name !== '..', 'name must not be ".."');
    (0, _assert2.default)(typeof packet.perm !== 'undefined', 'perm');
    (0, _assert2.default)(typeof packet.mode !== 'undefined', 'mode');

    return new Promise((resolve, reject) => {
      if (!this.fids[packet.fid]) {
        return reject(new _errors.IxpTaggedError(packet.tag, 'The fid is not in use. Invoke `attach` first.'));
      }

      const node = this.fids[packet.fid];
      const { file } = node;

      if (!file.isDir()) {
        return reject(new _errors.IxpTaggedError(packet.tag, 'Cannot create a file in a file.'));
      }

      let newFileM;
      if (_constants.DMDIR & packet.perm) {
        // possibly (packet.perm - DMDIR) >= 0
        newFileM = file.mkdir(packet.name);
      } else {
        newFileM = file.mkfile(packet.name);
      }
      if (newFileM.isNothing) {
        throw new TypeError(`Something went horribly wrong.
The file for fid=${packet.fid} could not create a file`);
      }

      const newFile = newFileM.get();
      this.fids[packet.fid] = new _fid2.default({ file: newFile, mode: packet.mode });

      node.mode = file.mode = packet.mode;
      return resolve({
        type: _protocol_data.packetType.Ropen,
        tag: packet.tag,
        qid: newFile.qid,
        iounit: 0
      });
    });
  }

  Tread(packet) {
    A.checkPacketBase(packet, _protocol_data.packetType.Tcreate);
    (0, _assert2.default)(packet.fid, 'fid');
    (0, _assert2.default)(typeof packet.offset !== 'undefined', 'offset');
    (0, _assert2.default)(packet.count, 'count'); // count == 0 is bad, I think

    return new Promise((resolve, reject) => {
      const node = this.fids[packet.fid];
      if (!node) {
        return reject(new _errors.IxpTaggedError(packet.tag, 'The fid is not in use. Invoke `attach` first.'));
      }

      const { file, mode } = node;
      if (!(mode & _constants.DMREAD)) {
        return reject(new _errors.IxpTaggedError(packet.tag, 'The fid is not open for reads. Use Topen first'));
      }

      if (!file.isReadable()) {
        return reject(new _errors.IxpTaggedError(packet.tag, `The ${file.isDir() ? 'directory' : 'file'} is not readable`));
      }
      if (file.isDir()) {
        if (!file.isExecable()) {
          return reject(new _errors.IxpTaggedError(packet.tag, 'The directory is not executable'));
        }

        return readDir(this, packet, node);
      }

      const data = file.read(packet.offset, packet.count);
      return resolve({
        type: _protocol_data.packetType.Rread,
        tag: packet.tag,
        count: data.length,
        data: data
      });
    });
  }

  Twrite(packet) {
    (0, _assert2.default)(packet.fid, 'fid must be defined');
    return new Promise((resolve, reject) => {
      const node = this.fids[packet.fid];
      if (!node) {
        return reject(new _errors.IxpTaggedError(packet.tag, 'no such fid'));
      }
      const { file, mode } = node;
      if (!(mode & _constants.DMWRITE)) {
        return reject(new _errors.IxpTaggedError(packet.tag, 'fid is not open for write'));
      }
      if (file.isDir()) {
        return reject(new _errors.IxpTaggedError(packet.tag, 'not possible to write to a directory'));
      }

      file.write(packet.offset, packet.count, packet.data);
      return resolve({
        type: _protocol_data.packetType.Rwrite,
        tag: packet.tag,
        count: packet.count
      });
    });
  }

  Tclunk(packet) {
    return new Promise((resolve, reject) => {
      if (!this.fids[packet.fid]) {
        return reject(new _errors.IxpTaggedError(packet.tag, 'no such fid'));
      }

      delete this.fids[packet.fid];
      delete this.fid2afid[packet.fid];
      return resolve({ type: _protocol_data.packetType.Rclunk, tag: packet.tag });
    });
  }

  Tremove(packet) {
    throw new Error('not implemented');
  }

  Tstat(packet) {
    throw new Error('not implemented');
  }

  Twstat(packet) {
    throw new Error('not implemented');
  }
}

exports.default = MemoryFileSystem;
function mustDenyAccess(file, mode) {
  // TODO: make better
  if (file.isDir()) {
    if (mode & _constants.DMWRITE) {
      return [true, 'directories are read only'];
    }
    if (mode & _constants.DMEXEC) {
      return [false];
    }
    return [true, 'Directories are executed to list contents'];
  }

  if (mode & _constants.DMEXEC) {
    return [true, 'OEXEC not allowed'];
  }
  if (!!(mode & _constants.DMWRITE) && !file.isWritable()) {
    return [true, 'file is read only'];
  }
  if (!(mode & _constants.DMREAD) && !(mode & _constants.DMWRITE)) {
    return [true, 'only read '];
  }

  return [false];
}

function readDir(service, packet, file) {
  return new Promise((resolve, reject) => {
    const reply = {
      type: _protocol_data.packetType.Rread,
      tag: packet.tag
    };
    if (packet.offset === 0) {
      file.bloc = file.nloc = 0;
    }

    if (packet.offset !== file.bloc) {
      return reject(new _errors.IxpTaggedError(packet.tag, `Seek in a directory is illegal!
packet.offset(${packet.offset}) != ${file.bloc}`));
    }

    reply.length = 4; // 32 bit int
    reply.data = file.nchildren.length;
    resolve(reply);
  });
}