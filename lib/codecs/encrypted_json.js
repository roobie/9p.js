/**
 * NOT SAFE (as in, not verified to be safe)
 */

import sodium from 'libsodium-wrappers'
import {Buffer} from 'buffer'

// re: WIRE_FORMAT
export const dataTransferEncoding = null
export const httpContentType = 'application/octet-stream'

// data format
const dataEncoding = 'utf8'
export function encode (plainObject) {
  const plainText = JSON.stringify(plainObject)
  return encrypt(plainText)
}

export function decode (cipherBuffer) {
  const json = decrypt(cipherBuffer)
  return JSON.parse(json)
}

// Load your secret key from a safe place and reuse it across multiple
// secretbox calls.
const secret = sodium.crypto_generichash(sodium.crypto_box_PUBLICKEYBYTES, 'secret')

// Given a message as a string, return a Buffer containing the
// nonce (in the first 24 bytes) and the encrypted content.
function encrypt (message) {
    // You must use a different nonce for each message you encrypt.
  var nonce = Buffer.from(sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES))
  var buf = Buffer.from(message, dataEncoding)
  return Buffer.concat([nonce, Buffer.from(sodium.crypto_secretbox_easy(buf, nonce, secret))])
}

// Decrypt takes a Buffer and returns the decrypted message as plain text.
function decrypt (encryptedBuffer) {
  var nonce = encryptedBuffer.slice(0, sodium.crypto_box_NONCEBYTES)
  var encryptedMessage = encryptedBuffer.slice(sodium.crypto_box_NONCEBYTES)
  return sodium.crypto_secretbox_open_easy(encryptedMessage, nonce, secret, 'text')
}
