'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Rversion = Rversion;
exports.Tversion = Tversion;
exports.Qid = Qid;
exports.Dir = Dir;

var _struct = require('struct');

var _struct2 = _interopRequireDefault(_struct);

var _protocol_data = require('./protocol_data');

var _utf8ByteLength = require('utf8-byte-length');

var _utf8ByteLength2 = _interopRequireDefault(_utf8ByteLength);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getStructProto() {
  return (0, _struct2.default)().word32Ule('size').word8('type').word16Ule('tag');
}

function Rversion(packet) {
  var msize = (0, _utf8ByteLength2.default)(packet.version);
  var struct = getStructProto().word32Ule('msize').chars('version', msize, 'utf-8').allocate();

  struct.set('size', struct.length());
  struct.set('type', _protocol_data.packetType.Rversion);
  struct.set('tag', packet.tag);
  struct.set('msize', msize);
  struct.set('version', packet.version);

  return struct;
}

function Tversion(tag, version) {
  var struct = Rversion({
    tag: tag,
    version: version
  });
  struct.fields.type = _protocol_data.packetType.Tversion;

  return struct;
}

function Qid(qid) {
  void '\ntypedef\nstruct Qid\n{\n  uvlong path;\n  ulong  vers;\n  uchar  type;\n} Qid;\n';
  var struct = (0, _struct2.default)().word8('type').word32Ule('version').word64Ule('path').allocate();

  struct.set('type', qid.type);
  struct.set('version', qid.version);
  struct.set('path', qid.path);

  return struct;
}

function Dir(name, uid, gid, muid) {
  void '\ntypedef\nstruct Dir {\n   /* system-modified data */\n  ushort  type; /* server type */\n  uint  dev;  /* server subtype */\n  /* file data */\n  Qid qid;  /* unique id from server */\n  ulong mode; /* permissions */\n  ulong atime;  /* last read time */\n  ulong mtime;  /* last write time */\n  vlong length; /* file length */\n  char  *name;  /* last element of path */\n  char  *uid; /* owner name */\n  char  *gid; /* group name */\n  char  *muid;  /* last modifier name */\n\n  /* 9P2000.u extensions */\n  uint  uidnum;   /* numeric uid */\n  uint  gidnum;   /* numeric gid */\n  uint  muidnum;  /* numeric muid */\n  char  *ext;   /* extended info */\n} Dir;';

  return (0, _struct2.default)().word32Sle('status').word8('type').word32Ule('dev').struct('qid', Qid()).word32Ule('mode').word32Ule('atime').word32Ule('mtime').word64Ule('length')

  // references to strings.
  .chars('name', byteLength(name), 'utf-8').chars('uid', byteLength(uid), 'utf-8').chars('gid', byteLength(gid), 'utf-8').chars('muid', byteLength(muid), 'utf-8');
}

function byteLength(str) {
  /// returns the byte length of an utf8 string
  var s = str.length;
  for (var i = str.length - 1; i >= 0; i--) {
    var code = str.charCodeAt(i);
    if (code > 0x7f && code <= 0x7ff) s++;else if (code > 0x7ff && code <= 0xffff) s += 2;
    if (code >= 0xDC00 && code <= 0xDFFF) i--; // trail surrogate
  }
  return s;
}