import { unzlibSync } from 'fflate'
import { concat, latin1, latin1Bytes, put32be, startsWith, u32be, utf8 } from './bytes.ts'
import type { BlockKind, Container, Decision, RawBlock } from './types.ts'
import { UnsupportedError } from './types.ts'

const SIG = '\x89PNG\r\n\x1a\n'

/** Ancillary chunks that affect how the image looks or animates; never removed. */
const KEEP = new Set(['tRNS', 'gAMA', 'cHRM', 'sRGB', 'iCCP', 'sBIT', 'bKGD', 'hIST', 'pHYs', 'sPLT', 'cICP', 'mDCV', 'cLLI', 'acTL', 'fcTL', 'fdAT'])

interface Chunk {
  type: string
  start: number
  end: number
  block?: number
}

export function parsePng(b: Uint8Array): Container {
  if (!startsWith(b, SIG)) throw new UnsupportedError('not a PNG')
  const chunks: Chunk[] = []
  const blocks: RawBlock[] = []
  let i = 8
  while (i + 12 <= b.length) {
    const len = u32be(b, i)
    const type = latin1(b.subarray(i + 4, i + 8))
    const end = i + 12 + len
    if (end > b.length) throw new UnsupportedError('truncated PNG chunk')
    const data = b.subarray(i + 8, i + 8 + len)
    const chunk: Chunk = { type, start: i, end }
    const critical = type.charCodeAt(0) >= 65 && type.charCodeAt(0) <= 90
    if (!critical && !KEEP.has(type)) {
      let kind: BlockKind = 'other'
      let label = `${type} chunk`
      let payload: Uint8Array = data
      let key: string | undefined
      try {
        if (type === 'tEXt' || type === 'zTXt' || type === 'iTXt') {
          const t = readText(type, data)
          key = t.key
          payload = new TextEncoder().encode(t.value) // decoded text; analysis reads it as UTF-8
          kind = t.key === 'XML:com.adobe.xmp' ? 'xmp' : 'text'
          label = kind === 'xmp' ? `${type} XMP` : `${type} ${t.key}`
        } else if (type === 'eXIf') {
          kind = 'exif'
          label = 'eXIf EXIF'
        } else if (type === 'caBX') {
          kind = 'c2pa'
          label = 'caBX C2PA'
        }
      } catch {
        // unreadable text chunk: still removable as "other"
      }
      chunk.block = blocks.length
      blocks.push({ id: blocks.length, kind, label, size: end - i, payload, key })
    }
    chunks.push(chunk)
    i = end
    if (type === 'IEND') break
  }

  return {
    format: 'png',
    blocks,
    imageData: () => concat(chunks.filter((c) => c.type === 'IHDR' || c.type === 'PLTE' || c.type === 'IDAT' || c.type === 'fdAT').map((c) => b.subarray(c.start, c.end))),
    rebuild(decide: (blk: RawBlock) => Decision) {
      const parts: Uint8Array[] = [b.subarray(0, 8)]
      for (const c of chunks) {
        if (c.block === undefined) {
          parts.push(b.subarray(c.start, c.end))
          continue
        }
        const blk = blocks[c.block]
        const d = decide(blk)
        if (d === 'keep') parts.push(b.subarray(c.start, c.end))
        else if (d !== 'drop') {
          if (blk.kind !== 'exif') throw new Error('PNG replacement is only supported for eXIf')
          parts.push(makeChunk('eXIf', d.replace))
        }
      }
      return concat(parts)
    },
  }
}

function readText(type: string, d: Uint8Array): { key: string; value: string } {
  const z = d.indexOf(0)
  if (z < 0) throw new Error('bad text chunk')
  const key = latin1(d.subarray(0, z))
  if (type === 'tEXt') return { key, value: latin1(d.subarray(z + 1)) }
  if (type === 'zTXt') return { key, value: latin1(unzlibSync(d.subarray(z + 2))) }
  // iTXt: keyword\0 compressionFlag compressionMethod languageTag\0 translatedKeyword\0 text
  const compressed = d[z + 1] === 1
  let p = z + 3
  const lang = d.indexOf(0, p)
  p = lang + 1
  const tk = d.indexOf(0, p)
  p = tk + 1
  const body = d.subarray(p)
  return { key, value: utf8(compressed ? unzlibSync(body) : body) }
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(b: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function makeChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length)
  put32be(out, 0, data.length)
  out.set(latin1Bytes(type), 4)
  out.set(data, 8)
  put32be(out, 8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}
