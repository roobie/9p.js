
export function encode (x) {
  return JSON.stringify(x)
}

export function decode (x) {
  return JSON.parse(x)
}

// re: WIRE_FORMAT
export const dataTransferEncoding = 'utf-8'
export const httpContentType = 'application/json'
