const latin1Decoder = new TextDecoder('latin1')
const utf8Decoder = new TextDecoder('utf-8')
const utf16leDecoder = new TextDecoder('utf-16le')
const utf16beDecoder = new TextDecoder('utf-16be')

export const latin1 = (b: Uint8Array) => latin1Decoder.decode(b)
export const utf8 = (b: Uint8Array) => utf8Decoder.decode(b)
export const utf16 = (b: Uint8Array, le: boolean) => (le ? utf16leDecoder : utf16beDecoder).decode(b)
export const ascii = (b: Uint8Array, start: number, length: number) => latin1(b.subarray(start, start + length))
export const encode = (s: string) => new TextEncoder().encode(s)
export const latin1Bytes = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0) & 0xff)

export function concat(parts: Uint8Array[]): Uint8Array {
  let n = 0
  for (const p of parts) n += p.length
  const out = new Uint8Array(n)
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

export function startsWith(b: Uint8Array, prefix: string, at = 0): boolean {
  if (b.length < at + prefix.length) return false
  for (let i = 0; i < prefix.length; i++) if (b[at + i] !== prefix.charCodeAt(i)) return false
  return true
}

export const u16be = (b: Uint8Array, o: number) => (b[o] << 8) | b[o + 1]
export const u32be = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0
export const u32le = (b: Uint8Array, o: number) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0

export function u64be(b: Uint8Array, o: number): number {
  const v = u32be(b, o) * 2 ** 32 + u32be(b, o + 4)
  if (!Number.isSafeInteger(v)) throw new RangeError('64-bit size too large')
  return v
}

export function put16be(b: Uint8Array, o: number, v: number) {
  b[o] = (v >>> 8) & 0xff
  b[o + 1] = v & 0xff
}
export function put32be(b: Uint8Array, o: number, v: number) {
  b[o] = (v >>> 24) & 0xff
  b[o + 1] = (v >>> 16) & 0xff
  b[o + 2] = (v >>> 8) & 0xff
  b[o + 3] = v & 0xff
}
export function put32le(b: Uint8Array, o: number, v: number) {
  b[o] = v & 0xff
  b[o + 1] = (v >>> 8) & 0xff
  b[o + 2] = (v >>> 16) & 0xff
  b[o + 3] = (v >>> 24) & 0xff
}

/** Read an unsigned big-endian integer of 0, 2, 4 or 8 bytes. */
export function readUint(b: Uint8Array, o: number, size: number): number {
  if (size === 0) return 0
  if (size === 2) return u16be(b, o)
  if (size === 4) return u32be(b, o)
  if (size === 8) return u64be(b, o)
  throw new RangeError(`bad int size ${size}`)
}

export function writeUint(b: Uint8Array, o: number, size: number, v: number) {
  if (size === 0) {
    if (v !== 0) throw new RangeError('value does not fit in 0 bytes')
    return
  }
  if (size === 2) {
    if (v > 0xffff) throw new RangeError('value does not fit in 2 bytes')
    return put16be(b, o, v)
  }
  if (size === 4) {
    if (v > 0xffffffff) throw new RangeError('value does not fit in 4 bytes')
    return put32be(b, o, v)
  }
  if (size === 8) {
    put32be(b, o, Math.floor(v / 2 ** 32))
    put32be(b, o + 4, v >>> 0)
    return
  }
  throw new RangeError(`bad int size ${size}`)
}

/** Growable byte writer. */
export class Writer {
  private buf = new Uint8Array(256)
  length = 0
  private ensure(n: number) {
    if (this.length + n <= this.buf.length) return
    let size = this.buf.length * 2
    while (size < this.length + n) size *= 2
    const next = new Uint8Array(size)
    next.set(this.buf.subarray(0, this.length))
    this.buf = next
  }
  bytes(b: Uint8Array) {
    this.ensure(b.length)
    this.buf.set(b, this.length)
    this.length += b.length
  }
  uint(size: number, v: number) {
    this.ensure(size)
    writeUint(this.buf, this.length, size, v)
    this.length += size
  }
  u8(v: number) {
    this.ensure(1)
    this.buf[this.length++] = v & 0xff
  }
  str(s: string) {
    this.bytes(latin1Bytes(s))
  }
  done(): Uint8Array {
    return this.buf.slice(0, this.length)
  }
}
