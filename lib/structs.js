import Struct from 'struct'
import {packetType} from './protocol_data'
import utf8byteLength from 'utf8-byte-length'

function getStructProto () {
  return Struct()
    .word32Ule('size')
    .word8('type')
    .word16Ule('tag')
}

export function Rversion (packet) {
  const msize = utf8byteLength(packet.version)
  const struct = getStructProto()
          .word32Ule('msize')
          .chars('version', msize, 'utf-8')
          .allocate()

  struct.set('size', struct.length())
  struct.set('type', packetType.Rversion)
  struct.set('tag', packet.tag)
  struct.set('msize', msize)
  struct.set('version', packet.version)

  return struct
}

export function Tversion (tag, version) {
  const struct = Rversion({
    tag,
    version
  })
  struct.fields.type = packetType.Tversion

  return struct
}

export function Qid (qid) {
  void `
typedef
struct Qid
{
  uvlong path;
  ulong  vers;
  uchar  type;
} Qid;
`
  const struct = Struct()
          .word8('type')
          .word32Ule('version')
          .word64Ule('path')
          .allocate()

  struct.set('type', qid.type)
  struct.set('version', qid.version)
  struct.set('path', qid.path)

  return struct
}

export function Dir (name, uid, gid, muid) {
  void `
typedef
struct Dir {
   /* system-modified data */
  ushort  type; /* server type */
  uint  dev;  /* server subtype */
  /* file data */
  Qid qid;  /* unique id from server */
  ulong mode; /* permissions */
  ulong atime;  /* last read time */
  ulong mtime;  /* last write time */
  vlong length; /* file length */
  char  *name;  /* last element of path */
  char  *uid; /* owner name */
  char  *gid; /* group name */
  char  *muid;  /* last modifier name */

  /* 9P2000.u extensions */
  uint  uidnum;   /* numeric uid */
  uint  gidnum;   /* numeric gid */
  uint  muidnum;  /* numeric muid */
  char  *ext;   /* extended info */
} Dir;`

  return Struct()
    .word32Sle('status')

    .word8('type')
    .word32Ule('dev')

    .struct('qid', Qid())
    .word32Ule('mode')
    .word32Ule('atime')
    .word32Ule('mtime')
    .word64Ule('length')

  // references to strings.
    .chars('name', byteLength(name), 'utf-8')
    .chars('uid', byteLength(uid), 'utf-8')
    .chars('gid', byteLength(gid), 'utf-8')
    .chars('muid', byteLength(muid), 'utf-8')
}

function byteLength (str) {
  /// returns the byte length of an utf8 string
  let s = str.length
  for (let i = str.length - 1; i >= 0; i--) {
    const code = str.charCodeAt(i)
    if (code > 0x7f && code <= 0x7ff) s++
    else if (code > 0x7ff && code <= 0xffff) s += 2
    if (code >= 0xDC00 && code <= 0xDFFF) i-- // trail surrogate
  }
  return s
}
