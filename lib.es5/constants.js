'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var VERSION9P = exports.VERSION9P = '9P2000';

/* bits in Dir.mode */
var DMDIR = exports.DMDIR = 0x80000000;
var DMAPPEND = exports.DMAPPEND = 0x40000000;
var DMEXCL = exports.DMEXCL = 0x20000000;
var DMMOUNT = exports.DMMOUNT = 0x10000000;
var DMAUTH = exports.DMAUTH = 0x08000000;
var DMTMP = exports.DMTMP = 0x04000000;
var DMNONE = exports.DMNONE = 0xFC000000;

var DMREAD = exports.DMREAD = 0x4; /* mode bit for read permission */
var DMWRITE = exports.DMWRITE = 0x2; /* mode bit for write permission */
var DMEXEC = exports.DMEXEC = 0x1; /* mode bit for execute permission */

var BIT8SZ = exports.BIT8SZ = 1;
var BIT16SZ = exports.BIT16SZ = 2;
var BIT32SZ = exports.BIT32SZ = 4;
var BIT64SZ = exports.BIT64SZ = 8;
var QIDSZ = exports.QIDSZ = BIT8SZ + BIT32SZ + BIT64SZ;

var MAXWELEM = exports.MAXWELEM = 16;
var STATFIXLEN = exports.STATFIXLEN = BIT16SZ + QIDSZ + 5 * BIT16SZ + 4 * BIT32SZ + BIT64SZ;
var MAXPKTSIZE = exports.MAXPKTSIZE = 8192;
var IOHDRSIZE = exports.IOHDRSIZE = BIT8SZ + BIT16SZ + 3 * BIT32SZ + BIT64SZ;

var Blocksize = exports.Blocksize = 65536;

/* bits in Qid.type */
var QTDIR = exports.QTDIR = 0x80; /* type bit for directories */
var QTAPPEND = exports.QTAPPEND = 0x40; /* type bit for append only files */
var QTEXCL = exports.QTEXCL = 0x20; /* type bit for exclusive use files */
var QTMOUNT = exports.QTMOUNT = 0x10; /* type bit for mounted channel */
var QTAUTH = exports.QTAUTH = 0x08; /* type bit for authentication file */
var QTTMP = exports.QTTMP = 0x04; /* type bit for non-backed-up file */
var QTSYMLINK = exports.QTSYMLINK = 0x02; /* type bit for symbolic link */
var QTFILE = exports.QTFILE = 0x00; /* type bits for plain file */