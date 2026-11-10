import { concat, latin1, readUint, u16be, u32be, u64be, Writer, writeUint } from './bytes.ts'
import type { BlockKind, Container, Decision, Format, RawBlock } from './types.ts'
import { UnsupportedError } from './types.ts'

/**
 * HEIC / AVIF (ISO BMFF, HEIF). Metadata lives in:
 * - items listed in meta/iinf: "Exif" items and "mime" items with application/rdf+xml (XMP), data located by meta/iloc;
 * - a top-level uuid box with the C2PA user type.
 * Removing an item takes it out of iinf, iloc, iref and ipma and zeroes its bytes; image item data is never touched.
 * Dropping boxes before mdat shifts file offsets, so iloc offsets (construction method 0) are rewritten.
 */

const C2PA_UUID = 'd8fec3d61b0e483c92975828877ec481'
const HEIC_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1', 'mif2'])
const AVIF_BRANDS = new Set(['avif', 'avis'])

interface Box {
  type: string
  start: number
  end: number
  /** Offset of the box content (after size, type, largesize, uuid). */
  body: number
  uuid?: string
}

function readBoxes(b: Uint8Array, start: number, end: number): Box[] {
  const out: Box[] = []
  let i = start
  while (i + 8 <= end) {
    let size = u32be(b, i)
    const type = latin1(b.subarray(i + 4, i + 8))
    let body = i + 8
    if (size === 1) {
      size = u64be(b, i + 8)
      body += 8
    } else if (size === 0) size = end - i
    if (size < body - i || i + size > end) throw new UnsupportedError(`bad ${type} box`)
    const box: Box = { type, start: i, end: i + size, body }
    if (type === 'uuid') {
      box.uuid = [...b.subarray(body, body + 16)].map((x) => x.toString(16).padStart(2, '0')).join('')
      box.body += 16
    }
    out.push(box)
    i += size
  }
  return out
}

export function sniffBmff(b: Uint8Array): Format | null {
  if (b.length < 16 || latin1(b.subarray(4, 8)) !== 'ftyp') return null
  const size = Math.min(u32be(b, 0), b.length)
  const brands = [latin1(b.subarray(8, 12))]
  for (let o = 16; o + 4 <= size; o += 4) brands.push(latin1(b.subarray(o, o + 4)))
  if (brands.some((x) => AVIF_BRANDS.has(x))) return 'avif'
  if (brands.some((x) => HEIC_BRANDS.has(x))) return 'heic'
  return null
}

interface Extent {
  index: number
  offset: number
  length: number
}
interface IlocItem {
  id: number
  method: number
  dataRef: number
  base: number
  extents: Extent[]
}
interface Iloc {
  version: number
  flags: number
  offsetSize: number
  lengthSize: number
  baseSize: number
  indexSize: number
  items: IlocItem[]
}

function parseIloc(b: Uint8Array, box: Box): Iloc {
  let p = box.body
  const version = b[p]
  const flags = (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3]
  p += 4
  const offsetSize = b[p] >> 4
  const lengthSize = b[p] & 15
  const baseSize = b[p + 1] >> 4
  const indexSize = version === 1 || version === 2 ? b[p + 1] & 15 : 0
  p += 2
  let count: number
  if (version < 2) {
    count = u16be(b, p)
    p += 2
  } else {
    count = u32be(b, p)
    p += 4
  }
  const items: IlocItem[] = []
  for (let k = 0; k < count; k++) {
    let id: number
    if (version < 2) {
      id = u16be(b, p)
      p += 2
    } else {
      id = u32be(b, p)
      p += 4
    }
    let method = 0
    if (version === 1 || version === 2) {
      method = u16be(b, p) & 15
      p += 2
    }
    const dataRef = u16be(b, p)
    p += 2
    const base = readUint(b, p, baseSize)
    p += baseSize
    const n = u16be(b, p)
    p += 2
    const extents: Extent[] = []
    for (let e = 0; e < n; e++) {
      const index = readUint(b, p, indexSize)
      p += indexSize
      const offset = readUint(b, p, offsetSize)
      p += offsetSize
      const length = readUint(b, p, lengthSize)
      p += lengthSize
      extents.push({ index, offset, length })
    }
    items.push({ id, method, dataRef, base, extents })
  }
  if (p > box.end) throw new UnsupportedError('bad iloc box')
  return { version, flags, offsetSize, lengthSize, baseSize, indexSize, items }
}

function writeIloc(il: Iloc, items: IlocItem[]): Uint8Array {
  const w = new Writer()
  w.uint(4, 0)
  w.str('iloc')
  w.u8(il.version)
  w.u8(il.flags >> 16)
  w.u8(il.flags >> 8)
  w.u8(il.flags)
  w.u8((il.offsetSize << 4) | il.lengthSize)
  w.u8((il.baseSize << 4) | il.indexSize)
  w.uint(il.version < 2 ? 2 : 4, items.length)
  for (const it of items) {
    w.uint(il.version < 2 ? 2 : 4, it.id)
    if (il.version === 1 || il.version === 2) w.uint(2, it.method)
    w.uint(2, it.dataRef)
    w.uint(il.baseSize, it.base)
    w.uint(2, it.extents.length)
    for (const e of it.extents) {
      w.uint(il.indexSize, e.index)
      w.uint(il.offsetSize, e.offset)
      w.uint(il.lengthSize, e.length)
    }
  }
  return sized(w.done())
}

function sized(box: Uint8Array): Uint8Array {
  writeUint(box, 0, 4, box.length)
  return box
}

interface Infe {
  id: number
  type: string
  contentType?: string
  name: string
  box: Box
}

function cstr(b: Uint8Array, p: number, end: number): [string, number] {
  let z = p
  while (z < end && b[z] !== 0) z++
  return [latin1(b.subarray(p, z)), z + 1]
}

function parseInfe(b: Uint8Array, box: Box): Infe | null {
  let p = box.body
  const version = b[p]
  p += 4
  if (version < 2) return null
  let id: number
  if (version === 2) {
    id = u16be(b, p)
    p += 2
  } else {
    id = u32be(b, p)
    p += 4
  }
  p += 2 // protection index
  const type = latin1(b.subarray(p, p + 4))
  p += 4
  const [name, q] = cstr(b, p, box.end)
  let contentType: string | undefined
  if (type === 'mime' && q < box.end) contentType = cstr(b, q, box.end)[0]
  return { id, type, contentType, name, box }
}

/** Per removed or replaced item: where its bytes are in the original file. */
interface ItemData {
  item: IlocItem
  /** Absolute file ranges of the item's extents, in order. */
  ranges: [number, number][]
}

export function parseBmff(b: Uint8Array): Container {
  const format = sniffBmff(b)
  if (!format) throw new UnsupportedError('not a HEIC/AVIF file')
  const top = readBoxes(b, 0, b.length)
  const meta = top.find((x) => x.type === 'meta')
  if (!meta) throw new UnsupportedError('HEIF file has no meta box')
  const hasMoov = top.some((x) => x.type === 'moov')
  const children = readBoxes(b, meta.body + 4, meta.end)
  const ilocBox = children.find((x) => x.type === 'iloc')
  const iinfBox = children.find((x) => x.type === 'iinf')
  const idatBox = children.find((x) => x.type === 'idat')
  if (!ilocBox || !iinfBox) throw new UnsupportedError('HEIF meta has no iloc/iinf')
  const iloc = parseIloc(b, ilocBox)
  const iinfVersion = b[iinfBox.body]
  const infeStart = iinfBox.body + 4 + (iinfVersion === 0 ? 2 : 4)
  const infes = readBoxes(b, infeStart, iinfBox.end)
    .filter((x) => x.type === 'infe')
    .map((x) => parseInfe(b, x))
    .filter((x): x is Infe => x !== null)

  const blocks: RawBlock[] = []
  const blockItem = new Map<number, ItemData>()
  const blockBox = new Map<number, Box>()

  const rangesOf = (it: IlocItem): [number, number][] | null => {
    if (it.dataRef !== 0) return null
    const out: [number, number][] = []
    for (const e of it.extents) {
      let start: number
      if (it.method === 0) start = it.base + e.offset
      else if (it.method === 1 && idatBox) start = idatBox.body + it.base + e.offset
      else return null
      const len = e.length || (it.method === 0 ? b.length - start : idatBox!.end - start)
      if (start + len > b.length) return null
      out.push([start, start + len])
    }
    return out
  }

  for (const inf of infes) {
    let kind: BlockKind | null = null
    let label = ''
    if (inf.type === 'Exif') {
      kind = 'exif'
      label = 'Exif item'
    } else if (inf.type === 'mime' && inf.contentType) {
      const ct = inf.contentType.toLowerCase()
      if (ct.includes('rdf+xml') || ct.includes('xmp')) {
        kind = 'xmp'
        label = 'XMP item'
      } else if (ct.includes('c2pa') || ct.includes('jumbf')) {
        kind = 'c2pa'
        label = 'C2PA item'
      }
    }
    if (!kind) continue
    const item = iloc.items.find((x) => x.id === inf.id)
    const ranges = item && rangesOf(item)
    if (!item || !ranges) continue
    const payload = concat(ranges.map(([s, e]) => b.subarray(s, e)))
    blockItem.set(blocks.length, { item, ranges })
    blocks.push({ id: blocks.length, kind, label, size: payload.length, payload })
  }

  for (const box of top) {
    if (box.type !== 'uuid') continue
    const isC2pa = box.uuid === C2PA_UUID
    blockBox.set(blocks.length, box)
    blocks.push({ id: blocks.length, kind: isC2pa ? 'c2pa' : 'other', label: isC2pa ? 'C2PA uuid box' : `uuid box ${box.uuid}`, size: box.end - box.start, payload: b.subarray(box.body, box.end) })
  }

  const metaIds = new Set([...blockItem.values()].map((d) => d.item.id))
  return {
    format,
    blocks,
    imageData: () =>
      concat(
        iloc.items
          .filter((it) => !metaIds.has(it.id))
          .sort((x, y) => x.id - y.id)
          .flatMap((it) => (rangesOf(it) ?? []).map(([s, e]) => b.subarray(s, e))),
      ),
    rebuild(decide: (blk: RawBlock) => Decision) {
      const w = b.slice()
      const removedIds = new Set<number>()
      const droppedBoxes = new Set<Box>()
      for (const blk of blocks) {
        const d = decide(blk)
        if (d === 'keep') continue
        const data = blockItem.get(blk.id)
        if (data) {
          if (d === 'drop') {
            for (const [s, e] of data.ranges) w.fill(0, s, e)
            removedIds.add(data.item.id)
          } else {
            if (d.replace.length !== blk.payload.length) throw new UnsupportedError('HEIF item replacement must keep its size')
            let o = 0
            for (const [s, e] of data.ranges) {
              w.set(d.replace.subarray(o, o + e - s), s)
              o += e - s
            }
          }
          continue
        }
        const box = blockBox.get(blk.id)
        if (box) {
          if (d !== 'drop') throw new UnsupportedError('uuid boxes can only be kept or dropped')
          droppedBoxes.add(box)
        }
      }
      if (!removedIds.size && !droppedBoxes.size) return w

      // New meta box
      const metaChildren: Uint8Array[] = []
      const ilocItems = iloc.items.filter((x) => !removedIds.has(x.id))
      let ilocAt = -1
      for (const c of children) {
        if (c === ilocBox) {
          ilocAt = metaChildren.length
          metaChildren.push(new Uint8Array(0)) // filled after offsets are known
        } else if (c === iinfBox) metaChildren.push(rebuildIinf(w, iinfBox, iinfVersion, infes, removedIds))
        else if (c.type === 'iref') metaChildren.push(rebuildIref(w, c, removedIds))
        else if (c.type === 'iprp') metaChildren.push(rebuildIprp(w, c, removedIds))
        else metaChildren.push(w.subarray(c.start, c.end))
      }
      // iloc keeps its field sizes and only loses items, so its new size is known before offsets change.
      const ilocSize = writeIloc(iloc, ilocItems).length
      let metaSize = 12
      metaChildren.forEach((c, k) => (metaSize += k === ilocAt ? ilocSize : c.length))

      // Regions that change size, in old file coordinates.
      const regions: { start: number; end: number; newSize: number }[] = [{ start: meta.start, end: meta.end, newSize: metaSize }]
      for (const box of droppedBoxes) regions.push({ start: box.start, end: box.end, newSize: 0 })
      const shift = (x: number) => {
        let d = 0
        for (const r of regions) if (r.end <= x) d += r.end - r.start - r.newSize
        return d
      }
      if (hasMoov && regions.some((r) => r.end - r.start !== r.newSize)) throw new UnsupportedError('HEIF/AVIF image sequences are not supported yet')

      const moved = ilocItems.map((it) => {
        if (it.method !== 0 || it.dataRef !== 0) return it
        if (it.base > 0) return { ...it, base: it.base - shift(it.base + (it.extents[0]?.offset ?? 0)) }
        return { ...it, extents: it.extents.map((e) => ({ ...e, offset: e.offset - shift(e.offset) })) }
      })
      metaChildren[ilocAt] = writeIloc(iloc, moved)

      const metaHead = new Uint8Array(12)
      writeUint(metaHead, 0, 4, metaSize)
      metaHead.set(w.subarray(meta.start + 4, meta.start + 8), 4)
      metaHead.set(w.subarray(meta.body, meta.body + 4), 8)
      if (meta.body - meta.start !== 8) throw new UnsupportedError('large meta box not supported')

      const parts: Uint8Array[] = []
      for (const box of top) {
        if (droppedBoxes.has(box)) continue
        if (box === meta) parts.push(metaHead, ...metaChildren)
        else parts.push(w.subarray(box.start, box.end))
      }
      return concat(parts)
    },
  }
}

function rebuildIinf(b: Uint8Array, box: Box, version: number, infes: Infe[], removed: Set<number>): Uint8Array {
  const w = new Writer()
  w.uint(4, 0)
  w.str('iinf')
  w.bytes(b.subarray(box.body, box.body + 4))
  w.uint(version === 0 ? 2 : 4, 0) // count, set below
  // Copy all children in order except removed infe boxes (keeps any infe versions we did not parse).
  const start = box.body + 4 + (version === 0 ? 2 : 4)
  const removedBoxes = new Set(infes.filter((x) => removed.has(x.id)).map((x) => x.box.start))
  const all = readBoxes(b, start, box.end)
  const count = all.filter((c) => !removedBoxes.has(c.start) && c.type === 'infe').length
  for (const c of all) if (!removedBoxes.has(c.start)) w.bytes(b.subarray(c.start, c.end))
  const out = w.done()
  writeUint(out, 12, version === 0 ? 2 : 4, count)
  return sized(out)
}

function rebuildIref(b: Uint8Array, box: Box, removed: Set<number>): Uint8Array {
  const version = b[box.body]
  const idSize = version === 0 ? 2 : 4
  const w = new Writer()
  w.uint(4, 0)
  w.str('iref')
  w.bytes(b.subarray(box.body, box.body + 4))
  for (const ref of readBoxes(b, box.body + 4, box.end)) {
    let p = ref.body
    const from = readUint(b, p, idSize)
    p += idSize
    const n = u16be(b, p)
    p += 2
    const to: number[] = []
    for (let k = 0; k < n; k++) to.push(readUint(b, p + k * idSize, idSize))
    const keptTo = to.filter((x) => !removed.has(x))
    if (removed.has(from) || !keptTo.length) continue
    if (keptTo.length === to.length) {
      w.bytes(b.subarray(ref.start, ref.end))
      continue
    }
    const r = new Writer()
    r.uint(4, 0)
    r.str(ref.type)
    r.uint(idSize, from)
    r.uint(2, keptTo.length)
    for (const x of keptTo) r.uint(idSize, x)
    w.bytes(sized(r.done()))
  }
  return sized(w.done())
}

function rebuildIprp(b: Uint8Array, box: Box, removed: Set<number>): Uint8Array {
  const w = new Writer()
  w.uint(4, 0)
  w.str('iprp')
  for (const c of readBoxes(b, box.body, box.end)) {
    if (c.type !== 'ipma') {
      w.bytes(b.subarray(c.start, c.end))
      continue
    }
    const version = b[c.body]
    const flags = b[c.body + 3]
    const idSize = version < 1 ? 2 : 4
    const assocSize = flags & 1 ? 2 : 1
    let p = c.body + 4
    const n = u32be(b, p)
    p += 4
    const entries: Uint8Array[] = []
    for (let k = 0; k < n; k++) {
      const s = p
      const id = readUint(b, p, idSize)
      p += idSize
      const count = b[p]
      p += 1 + count * assocSize
      if (!removed.has(id)) entries.push(b.subarray(s, p))
    }
    const m = new Writer()
    m.uint(4, 0)
    m.str('ipma')
    m.bytes(b.subarray(c.body, c.body + 4))
    m.uint(4, entries.length)
    for (const e of entries) m.bytes(e)
    m.bytes(b.subarray(p, c.end))
    w.bytes(sized(m.done()))
  }
  return sized(w.done())
}
