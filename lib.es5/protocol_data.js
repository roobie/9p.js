'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var specification = '\nsize[4] Tversion tag[2] msize[4] version[s]\nsize[4] Rversion tag[2] msize[4] version[s]\n\nsize[4] Tauth tag[2] afid[4] uname[s] aname[s]\nsize[4] Rauth tag[2] aqid[13]\n\nsize[4] Rerror tag[2] ename[s]\n\nsize[4] Tflush tag[2] oldtag[2]\nsize[4] Rflush tag[2]\n\nsize[4] Tattach tag[2] fid[4] afid[4] uname[s] aname[s]\nsize[4] Rattach tag[2] qid[13]\n\nsize[4] Twalk tag[2] fid[4] newfid[4] nwname[2] nwname*(wname[s])\nsize[4] Rwalk tag[2] nwqid[2] nwqid*(wqid[13])\n\nsize[4] Topen tag[2] fid[4] mode[1]\nsize[4] Ropen tag[2] qid[13] iounit[4]\n\nsize[4] Tcreate tag[2] fid[4] name[s] perm[4] mode[1]\nsize[4] Rcreate tag[2] qid[13] iounit[4]\n\nsize[4] Tread tag[2] fid[4] offset[8] count[4]\nsize[4] Rread tag[2] count[4] data[count]\n\nsize[4] Twrite tag[2] fid[4] offset[8] count[4] data[count]\nsize[4] Rwrite tag[2] count[4]\n\nsize[4] Tclunk tag[2] fid[4]\nsize[4] Rclunk tag[2]\n\nsize[4] Tremove tag[2] fid[4]\nsize[4] Rremove tag[2]\n\nsize[4] Tstat tag[2] fid[4]\nsize[4] Rstat tag[2] stat[n]\n\nsize[4] Twstat tag[2] fid[4] stat[n]\nsize[4] Rwstat tag[2]\n';

var specificationLines = specification.split('\n').filter(function (x) {
  return !!x;
});

var fieldSizes = exports.fieldSizes = function () {
  var lines = specificationLines;
  var result = {};

  lines.filter(function (x) {
    return !!x;
  }).forEach(function (line) {
    var fields = line.trim().split(' ');
    fields.filter(function (fld) {
      return fld.includes(']') && !fld.includes('*');
    }).map(parseField).forEach(function (spec) {
      var asInt = parseInt(spec.size, 10);
      if (isNaN(asInt)) {
        result[spec.name] = spec.size;
      } else {
        result[spec.name] = asInt;
      }
    });
  });

  // type is one byte
  result.type = 1;

  return result;
}();

var packetSpecs = exports.packetSpecs = function () {
  var lines = specificationLines;
  return lines.reduce(function (acc, line) {
    var fields = line.trim().split(' ');

    var size = parseField(fields[0]);
    var typeName = fields[1];
    var type = {
      size: 1,
      name: typeName
    };

    acc[typeName] = [size, type].concat(_toConsumableArray(fields.slice(2).map(parseField)));

    return acc;
  }, {});
}();

function parseField(fld) {
  var parts = fld.replace(']', '').split('[');
  return {
    name: parts[0],
    size: parts[1]
  };
}

/**
 * A mapping for name{string} -> type{int}
 * E.g. packetType.Rerror // => 107
 */
var packetType = exports.packetType = {
  Tversion: 100,
  Rversion: 101,
  Tauth: 102,
  Rauth: 103,
  Tattach: 104,
  Rattach: 105,
  Terror: 106, /* illegal */
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
};

var packets = exports.packets = function () {
  var result = [];
  for (var typeName in packetType) {
    result[packetType[typeName]] = typeName;
  }

  return result;
}();