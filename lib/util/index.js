import range from './range'

export default {
  range
}

export function octal (x) {
  return parseInt(x, 8)
}

export function isNil (x) {
  return x === undefined || x === null
}
