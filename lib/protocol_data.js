const specification = `
size[4] Tversion tag[2] msize[4] version[s]
size[4] Rversion tag[2] msize[4] version[s]

size[4] Tauth tag[2] afid[4] uname[s] aname[s]
size[4] Rauth tag[2] aqid[13]

size[4] Rerror tag[2] ename[s]

size[4] Tflush tag[2] oldtag[2]
size[4] Rflush tag[2]

size[4] Tattach tag[2] fid[4] afid[4] uname[s] aname[s]
size[4] Rattach tag[2] qid[13]

size[4] Twalk tag[2] fid[4] newfid[4] nwname[2] nwname*(wname[s])
size[4] Rwalk tag[2] nwqid[2] nwqid*(wqid[13])

size[4] Topen tag[2] fid[4] mode[1]
size[4] Ropen tag[2] qid[13] iounit[4]

size[4] Tcreate tag[2] fid[4] name[s] perm[4] mode[1]
size[4] Rcreate tag[2] qid[13] iounit[4]

size[4] Tread tag[2] fid[4] offset[8] count[4]
size[4] Rread tag[2] count[4] data[count]

size[4] Twrite tag[2] fid[4] offset[8] count[4] data[count]
size[4] Rwrite tag[2] count[4]

size[4] Tclunk tag[2] fid[4]
size[4] Rclunk tag[2]

size[4] Tremove tag[2] fid[4]
size[4] Rremove tag[2]

size[4] Tstat tag[2] fid[4]
size[4] Rstat tag[2] stat[n]

size[4] Twstat tag[2] fid[4] stat[n]
size[4] Rwstat tag[2]
`

const specificationLines = specification.split('\n').filter(x => !!x)

export const fieldSizes = (function () {
  const lines = specificationLines
  const result = {}

  lines
    .filter(x => !!x)
    .forEach(line => {
      const fields = line.trim().split(' ')
      fields
        .filter(fld => fld.includes(']') && !fld.includes('*'))
        .map(parseField)
        .forEach(spec => {
          const asInt = parseInt(spec.size, 10)
          if (isNaN(asInt)) {
            result[spec.name] = spec.size
          } else {
            result[spec.name] = asInt
          }
        })
    })

  // type is one byte
  result.type = 1

  return result
}())

export const packetSpecs = (function () {
  const lines = specificationLines
  return lines.reduce((acc, line) => {
    const fields = line.trim().split(' ')

    const size = parseField(fields[0])
    const typeName = fields[1]
    const type = {
      size: 1,
      name: typeName
    }

    acc[typeName] = [
      size,
      type,
      ...fields.slice(2).map(parseField)
    ]

    return acc
  }, {})
}())

function parseField (fld) {
  const parts = fld.replace(']', '').split('[')
  return {
    name: parts[0],
    size: parts[1]
  }
}

/**
 * A mapping for name{string} -> type{int}
 * E.g. packetType.Rerror // => 107
 */
export const packetType = {
  Tversion: 100,
  Rversion: 101,
  Tauth: 102,
  Rauth: 103,
  Tattach: 104,
  Rattach: 105,
  Terror: 106,  /* illegal */
  Rerror: 107,
  Tflush: 108,
  Rflush: 109,
  Twalk: 110,
  Rwalk: 111,
  Topen: 112,
  Ropen: 113,
  Tcreate: 114,
  Rcreate: 115,
  Tread: 116,
  Rread: 117,
  Twrite: 118,
  Rwrite: 119,
  Tclunk: 120,
  Rclunk: 121,
  Tremove: 122,
  Rremove: 123,
  Tstat: 124,
  Rstat: 125,
  Twstat: 126,
  Rwstat: 127,
  Tmax: 128,

  Topenfd: 98,
  Ropenfd: 99
}

export const packets = (function () {
  const result = []
  for (let typeName in packetType) {
    result[packetType[typeName]] = typeName
  }

  return result
}())
