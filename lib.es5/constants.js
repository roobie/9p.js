'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
const VERSION9P = exports.VERSION9P = '9P2000';

/* bits in Dir.mode */
const DMDIR = exports.DMDIR = 0x80000000;
const DMAPPEND = exports.DMAPPEND = 0x40000000;
const DMEXCL = exports.DMEXCL = 0x20000000;
const DMMOUNT = exports.DMMOUNT = 0x10000000;
const DMAUTH = exports.DMAUTH = 0x08000000;
const DMTMP = exports.DMTMP = 0x04000000;
const DMNONE = exports.DMNONE = 0xFC000000;

const DMREAD = exports.DMREAD = 0x4; /* mode bit for read permission */
const DMWRITE = exports.DMWRITE = 0x2; /* mode bit for write permission */
const DMEXEC = exports.DMEXEC = 0x1; /* mode bit for execute permission */

const BIT8SZ = exports.BIT8SZ = 1;
const BIT16SZ = exports.BIT16SZ = 2;
const BIT32SZ = exports.BIT32SZ = 4;
const BIT64SZ = exports.BIT64SZ = 8;
const QIDSZ = exports.QIDSZ = BIT8SZ + BIT32SZ + BIT64SZ;

const MAXWELEM = exports.MAXWELEM = 16;
const STATFIXLEN = exports.STATFIXLEN = BIT16SZ + QIDSZ + 5 * BIT16SZ + 4 * BIT32SZ + BIT64SZ;
const MAXPKTSIZE = exports.MAXPKTSIZE = 8192;
const IOHDRSIZE = exports.IOHDRSIZE = BIT8SZ + BIT16SZ + 3 * BIT32SZ + BIT64SZ;

const Blocksize = exports.Blocksize = 65536;

/* bits in Qid.type */
const QTDIR = exports.QTDIR = 0x80; /* type bit for directories */
const QTAPPEND = exports.QTAPPEND = 0x40; /* type bit for append only files */
const QTEXCL = exports.QTEXCL = 0x20; /* type bit for exclusive use files */
const QTMOUNT = exports.QTMOUNT = 0x10; /* type bit for mounted channel */
const QTAUTH = exports.QTAUTH = 0x08; /* type bit for authentication file */
const QTTMP = exports.QTTMP = 0x04; /* type bit for non-backed-up file */
const QTSYMLINK = exports.QTSYMLINK = 0x02; /* type bit for symbolic link */
const QTFILE = exports.QTFILE = 0x00; /* type bits for plain file */