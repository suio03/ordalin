// Shared with ailabelremover.tools (same owner). Parsing only, runs in the browser.
import { analyze, type Analysis } from './analyze.ts'
import { blankTags, orientationOnlyTiff } from './exif.ts'
import { parseBmff, sniffBmff } from './isobmff.ts'
import { parseJpeg } from './jpeg.ts'
import { parsePng } from './png.ts'
import { parseWebp } from './webp.ts'
import { startsWith } from './bytes.ts'
import type { Block, Container, Decision, Format, Mode, RawBlock, Scan } from './types.ts'
import { UnsupportedError } from './types.ts'

export * from './types.ts'

export function sniff(b: Uint8Array): Format | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg'
  if (startsWith(b, '\x89PNG\r\n\x1a\n')) return 'png'
  if (startsWith(b, 'RIFF') && startsWith(b, 'WEBP', 8)) return 'webp'
  return sniffBmff(b)
}

export function open(b: Uint8Array): Container {
  const f = sniff(b)
  if (f === 'jpeg') return parseJpeg(b)
  if (f === 'png') return parsePng(b)
  if (f === 'webp') return parseWebp(b)
  if (f === 'heic' || f === 'avif') return parseBmff(b)
  throw new UnsupportedError('Unsupported file type. Use JPG, PNG, WebP, HEIC or AVIF.')
}

/** Read the metadata of a file. `residual` also searches the whole file for AI markers outside parsed blocks. */
export function scan(b: Uint8Array, opts: { residual?: boolean } = {}): Scan {
  return analyze(open(b), opts.residual ? b : undefined).scan
}

export interface CleanResult {
  bytes: Uint8Array
  before: Scan
  after: Scan
  /** Blocks removed (by before-scan id). */
  removed: Block[]
  /** Blocks kept but rewritten (EXIF orientation-only or AI tags blanked). */
  rewritten: Block[]
}

function decider(c: Container, a: Analysis, mode: Mode) {
  return (blk: RawBlock): Decision => {
    const info = a.scan.blocks[blk.id]
    if (blk.kind === 'c2pa') return 'drop'
    if (mode === 'all') {
      if (blk.kind === 'exif') {
        const o = a.scan.orientation
        // HEIF stores rotation in irot/imir, not EXIF; elsewhere keep a minimal EXIF with only Orientation.
        if (o && o > 1 && c.format !== 'heic' && c.format !== 'avif') return { replace: orientationOnlyTiff(o) }
        return 'drop'
      }
      return 'drop'
    }
    if (blk.kind === 'exif') {
      const tags = a.exifAiTags.get(blk.id)
      return tags?.length ? { replace: blankTags(blk.payload, tags) } : 'keep'
    }
    return info.ai ? 'drop' : 'keep'
  }
}

export function clean(b: Uint8Array, mode: Mode = 'all'): CleanResult {
  const c = open(b)
  const a = analyze(c, b)
  const decide = decider(c, a, mode)
  const removed: Block[] = []
  const rewritten: Block[] = []
  const bytes = c.rebuild((blk) => {
    const d = decide(blk)
    if (d === 'drop') removed.push(a.scan.blocks[blk.id])
    else if (d !== 'keep') rewritten.push(a.scan.blocks[blk.id])
    return d
  })
  const after = scan(bytes, { residual: true })
  return { bytes, before: a.scan, after, removed, rewritten }
}

export function extensionFor(f: Format): string {
  return f === 'jpeg' ? 'jpg' : f
}
