
export const VERSION9P = '9P2000'

/* bits in Dir.mode */
export const DMDIR = 0x80000000
export const DMAPPEND = 0x40000000
export const DMEXCL = 0x20000000
export const DMMOUNT = 0x10000000
export const DMAUTH = 0x08000000
export const DMTMP = 0x04000000
export const DMNONE = 0xFC000000

export const DMREAD = 0x4  /* mode bit for read permission */
export const DMWRITE = 0x2 /* mode bit for write permission */
export const DMEXEC = 0x1  /* mode bit for execute permission */

export const BIT8SZ = 1
export const BIT16SZ = 2
export const BIT32SZ = 4
export const BIT64SZ = 8
export const QIDSZ = (BIT8SZ + BIT32SZ + BIT64SZ)

export const MAXWELEM = 16
export const STATFIXLEN = BIT16SZ + QIDSZ + (5 * BIT16SZ) + (4 * BIT32SZ) + BIT64SZ
export const MAXPKTSIZE = 8192
export const IOHDRSIZE = BIT8SZ + BIT16SZ + (3 * BIT32SZ) + BIT64SZ

export const Blocksize = 65536

/* bits in Qid.type */
export const QTDIR = 0x80     /* type bit for directories */
export const QTAPPEND = 0x40  /* type bit for append only files */
export const QTEXCL = 0x20    /* type bit for exclusive use files */
export const QTMOUNT = 0x10   /* type bit for mounted channel */
export const QTAUTH = 0x08    /* type bit for authentication file */
export const QTTMP = 0x04     /* type bit for non-backed-up file */
export const QTSYMLINK = 0x02 /* type bit for symbolic link */
export const QTFILE = 0x00    /* type bits for plain file */
