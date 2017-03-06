
export class IxpTaggedError extends Error {
  constructor (tag, msg) {
    super(msg)
    this.tag = tag
  }
}
