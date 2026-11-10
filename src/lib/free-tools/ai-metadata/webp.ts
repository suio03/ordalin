import { concat, latin1, put32le, startsWith, u32le } from './bytes.ts'
import type { BlockKind, Container, Decision, RawBlock } from './types.ts'
import { UnsupportedError } from './types.ts'

interface Chunk {
  fourcc: string
  start: number
  end: number
  block?: number
}

const VP8X_EXIF = 0x08
const VP8X_XMP = 0x04

/**
 * WebP (RIFF): metadata chunks are EXIF, "XMP " and C2PA. Image chunks (VP8/VP8L/ALPH/ANIM/ANMF/ICCP) are copied as-is.
 * VP8X flags and the RIFF size are updated to match.
 */
export function parseWebp(b: Uint8Array): Container {
  if (!startsWith(b, 'RIFF') || !startsWith(b, 'WEBP', 8)) throw new UnsupportedError('not a WebP')
  const riffEnd = Math.min(b.length, 8 + u32le(b, 4))
  const chunks: Chunk[] = []
  const blocks: RawBlock[] = []
  let i = 12
  while (i + 8 <= riffEnd) {
    const fourcc = latin1(b.subarray(i, i + 4))
    const len = u32le(b, i + 4)
    const end = i + 8 + len + (len & 1)
    if (i + 8 + len > b.length) throw new UnsupportedError('truncated WebP chunk')
    const chunk: Chunk = { fourcc, start: i, end: Math.min(end, b.length) }
    let kind: BlockKind | null = null
    if (fourcc === 'EXIF') kind = 'exif'
    else if (fourcc === 'XMP ') kind = 'xmp'
    else if (fourcc === 'C2PA') kind = 'c2pa'
    if (kind) {
      chunk.block = blocks.length
      blocks.push({ id: blocks.length, kind, label: `${fourcc.trim()} chunk`, size: chunk.end - i, payload: b.subarray(i + 8, i + 8 + len) })
    }
    chunks.push(chunk)
    i = chunk.end
  }

  return {
    format: 'webp',
    blocks,
    imageData: () => concat(chunks.filter((c) => ['VP8 ', 'VP8L', 'ALPH', 'ANMF'].includes(c.fourcc)).map((c) => b.subarray(c.start, c.end))),
    rebuild(decide: (blk: RawBlock) => Decision) {
      const parts: Uint8Array[] = []
      let hasExif = false
      let hasXmp = false
      let vp8xIndex = -1
      for (const c of chunks) {
        if (c.block === undefined) {
          if (c.fourcc === 'VP8X') {
            vp8xIndex = parts.length
            parts.push(b.slice(c.start, c.end))
          } else parts.push(b.subarray(c.start, c.end))
          continue
        }
        const blk = blocks[c.block]
        const d = decide(blk)
        if (d === 'drop') continue
        if (blk.kind === 'exif') hasExif = true
        if (blk.kind === 'xmp') hasXmp = true
        if (d === 'keep') parts.push(b.subarray(c.start, c.end))
        else parts.push(makeChunk(c.fourcc, d.replace))
      }
      if (vp8xIndex >= 0) {
        const v = parts[vp8xIndex]
        let flags = v[8] & ~(VP8X_EXIF | VP8X_XMP)
        if (hasExif) flags |= VP8X_EXIF
        if (hasXmp) flags |= VP8X_XMP
        v[8] = flags
      }
      const body = concat(parts)
      const head = new Uint8Array(12)
      head.set(b.subarray(0, 12))
      put32le(head, 4, body.length + 4)
      return concat([head, body])
    },
  }
}

function makeChunk(fourcc: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(8 + data.length + (data.length & 1))
  for (let k = 0; k < 4; k++) out[k] = fourcc.charCodeAt(k)
  put32le(out, 4, data.length)
  out.set(data, 8)
  return out
}
