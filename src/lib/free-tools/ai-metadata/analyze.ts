import { latin1, u16be, u32be, utf8 } from './bytes.ts'
import { gpsOf, orientationOf, parseExif, TAG_NAMES, tagText, TEXT_TAGS, type ExifTag } from './exif.ts'
import type { Block, Container, Field, PrivacyItem, PrivacyKind, RawBlock, Scan, Verdict } from './types.ts'

/** Generator names that are unambiguous anywhere in the file. */
const STRONG = /generative ai|volcengine|doubao|bytedance|midjourney|dall[-·\s]?e|openai|chatgpt|gpt-?4o|gpt-image|adobe firefly|firefly|generative (fill|expand)|stable[\s_-]?diffusion|\bsdxl\b|comfyui|automatic1111|invokeai|novelai|leonardo\.?ai|ideogram|google ai|imagen \d|nano[\s-]?banana|black forest labs|flux\.1|bing image creator|microsoft designer|meta ai|seedream|jimeng|dreamina|kling|hailuo|recraft|playground ?ai|krea|nightcafe|\bdreamstudio\b/i

/** Names that are ordinary words; only trusted in fields that name software. */
const WEAK = /\bflux\b|gemini|imagen|\bsora\b|runway|\bgrok\b|aurora|canva|copilot|designer|\bdiffusion\b/i

/** Prompt and pipeline markers (A1111, ComfyUI, Midjourney parameters). */
const PROMPT = /negative prompt:|\bsteps: ?\d+|\bsampler: |cfg scale|"class_type"|ksampler|--(ar|v|niji|stylize|chaos) \S/i

const AI_SOURCE_TYPES: Record<string, string> = {
  trainedalgorithmicmedia: 'IPTC source type: created by generative AI',
  compositewithtrainedalgorithmicmedia: 'IPTC source type: edited with generative AI',
  algorithmicmedia: 'IPTC source type: created by an algorithm',
  compositesynthetic: 'IPTC source type: composite with synthetic elements',
  algorithmicallyenhanced: 'IPTC source type: enhanced by an algorithm',
}

/** PNG text keys written by AI tools. */
const AI_TEXT_KEYS = new Set(['parameters', 'prompt', 'workflow', 'dream', 'sd-metadata', 'invokeai_metadata', 'negative_prompt', 'generation_data', 'novelai', 'comment_ai'])

/** Long markers that should never survive cleaning anywhere in the file. */
const RESIDUAL_MARKERS = ['trainedAlgorithmicMedia', 'compositeWithTrainedAlgorithmicMedia', 'c2pa.claim', 'c2pa.actions', 'c2pa.signature', 'Made with Google AI', 'Negative prompt:', 'sd-metadata', 'invokeai_metadata', '"class_type"']

const MAX_VALUE = 400

/** EXIF tags that reveal personal data. */
const EXIF_PRIVACY: Record<number, PrivacyKind> = {
  0x010f: 'device', 0x0110: 'device', 0x013c: 'device', 0xa431: 'device', 0xa433: 'device', 0xa434: 'device', 0xa435: 'device',
  0x0132: 'date', 0x9003: 'date',
  0x013b: 'person', 0x8298: 'person', 0x9c9d: 'person', 0xa430: 'person',
}

/** XMP / IPTC field names (local part, or the full IPTC label) that reveal personal data. */
function namedPrivacy(key: string): PrivacyKind | undefined {
  const local = key.split(':').pop()!
  if (/^GPS(Latitude|Longitude|Altitude)$|^(City|State|Country|Location|Sublocation|CountryCode)$/i.test(local)) return 'location'
  if (/^(Make|Model|SerialNumber|BodySerialNumber|LensSerialNumber|OwnerName|CameraOwnerName|Lens|LensModel)$/i.test(local)) return 'device'
  if (/^(DateTimeOriginal|DateCreated|CreateDate)$/i.test(local)) return 'date'
  if (/^(creator|Artist|AuthorsPosition|CaptionWriter|By-line|Writer|rights)$/i.test(local) || key === 'IPTC By-line' || key === 'IPTC Writer') return 'person'
  return undefined
}

export interface Analysis {
  scan: Scan
  /** For EXIF blocks: the AI tags, so ai-only mode can blank them in place. */
  exifAiTags: Map<number, ExifTag[]>
}

function sourceType(value: string): string | undefined {
  const k = value.split('/').pop()!.toLowerCase().replace(/[^a-z]/g, '')
  return AI_SOURCE_TYPES[k]
}

/** Is this value an AI signal? `software` = the field names a tool (Software, CreatorTool, generator). */
function judge(value: string, software: boolean): string | undefined {
  const st = sourceType(value)
  if (st && /algorithmic|synthetic/i.test(value)) return st
  const s = value.match(STRONG)
  if (s) return `names an AI generator (${s[0]})`
  if (software) {
    const w = value.match(WEAK)
    if (w) return `names an AI tool (${w[0]})`
  }
  if (PROMPT.test(value)) return 'looks like a generation prompt or settings'
  return undefined
}

const short = (s: string) => (s.length > MAX_VALUE ? `${s.slice(0, MAX_VALUE)}…` : s)

function field(key: string, value: string, software = false, reason?: string): Field {
  const r = reason ?? judge(value, software)
  return { key, value: short(value), ai: !!r, reason: r }
}

const SOFTWARE_EXIF = new Set([0x010f, 0x0110, 0x0131, 0x013c, 0xa433, 0xa434])

function exifFields(blk: RawBlock, aiTags: ExifTag[]): Field[] {
  const p = parseExif(blk.payload)
  if (!p) return [{ key: 'EXIF', value: 'unreadable EXIF data', ai: false }]
  const out: Field[] = []
  for (const t of p.tags) {
    const name = TAG_NAMES[t.tag]
    if (!name || t.ifd === 'GPS') continue
    const value = tagText(blk.payload, t, p.le)
    if (!value) continue
    const f: Field = TEXT_TAGS.has(t.tag) ? field(name, value, SOFTWARE_EXIF.has(t.tag)) : { key: name, value, ai: false }
    if (f.ai) aiTags.push(t)
    else if (EXIF_PRIVACY[t.tag]) f.privacy = EXIF_PRIVACY[t.tag]
    out.push(f)
  }
  if (p.hasGps) {
    const g = gpsOf(blk.payload, p)
    out.push({ key: 'GPS', value: g ? `${g.lat.toFixed(5)}, ${g.lon.toFixed(5)}` : 'location present', ai: false, privacy: 'location' })
  }
  return out
}

/** Pull simple properties out of XMP: attributes and leaf elements. */
function xmpFields(xml: string): Field[] {
  const out: Field[] = []
  const seen = new Set<string>()
  const add = (key: string, raw: string) => {
    const value = decodeEntities(raw).trim()
    if (!value || key.startsWith('xmlns') || key.startsWith('rdf:') || key === 'x:xmptk') return
    const id = `${key}=${value}`
    if (seen.has(id)) return
    seen.add(id)
    const local = key.split(':').pop()!
    const software = /CreatorTool|softwareAgent|Software|Generator|Credit|Source|ToolName|claim_generator/i.test(local)
    const st = /DigitalSourceType/i.test(local) ? sourceType(value) : undefined
    out.push(field(key, value, software, st))
  }
  for (const m of xml.matchAll(/\s([A-Za-z][\w.-]*:[\w.-]+)="([^"]*)"/g)) add(m[1], m[2])
  for (const m of xml.matchAll(/<([A-Za-z][\w.-]*:[\w.-]+)(?:\s[^>]*)?>([^<]+)<\/\1>/g)) add(m[1], m[2])
  // rdf:li values inside a named container: <dc:creator><rdf:Seq><rdf:li>…
  for (const m of xml.matchAll(/<([A-Za-z][\w.-]*:[\w.-]+)>\s*<rdf:(?:Alt|Seq|Bag)>([\s\S]*?)<\/rdf:(?:Alt|Seq|Bag)>/g)) {
    for (const li of m[2].matchAll(/<rdf:li[^>]*>([^<]*)<\/rdf:li>/g)) add(m[1], li[1])
  }
  // Keep AI fields and a few useful ones; long XMP otherwise floods the list.
  const ai = out.filter((f) => f.ai)
  const rest = out.filter((f) => !f.ai).slice(0, 30)
  return [...ai, ...rest]
}

const decodeEntities = (s: string) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&')

const IIM_NAMES: Record<number, string> = { 5: 'Object Name', 25: 'Keywords', 40: 'Special Instructions', 80: 'By-line', 105: 'Headline', 110: 'Credit', 115: 'Source', 116: 'Copyright Notice', 120: 'Caption', 122: 'Writer' }

function iptcFields(b: Uint8Array): Field[] {
  const out: Field[] = []
  let i = 0
  while (i + 12 <= b.length && latin1(b.subarray(i, i + 4)) === '8BIM') {
    const id = u16be(b, i + 4)
    const nameLen = b[i + 6]
    let p = i + 7 + nameLen
    if ((nameLen + 1) & 1) p++
    const size = u32be(b, p)
    p += 4
    const data = b.subarray(p, p + size)
    if (id === 0x0404) out.push(...iimFields(data))
    else if (id === 0x0424) out.push(...xmpFields(utf8(data)))
    i = p + size + (size & 1)
  }
  return out
}

function iimFields(d: Uint8Array): Field[] {
  const out: Field[] = []
  let i = 0
  while (i + 5 <= d.length && d[i] === 0x1c) {
    const rec = d[i + 1]
    const ds = d[i + 2]
    const len = u16be(d, i + 3)
    const v = utf8(d.subarray(i + 5, i + 5 + len)).trim()
    if (rec === 2 && IIM_NAMES[ds] && v) out.push(field(`IPTC ${IIM_NAMES[ds]}`, v, ds === 110 || ds === 115))
    i += 5 + len
  }
  return out
}

/** Printable ASCII runs, for binary blocks (C2PA CBOR, unknown APPn). */
function strings(b: Uint8Array, min = 4): string[] {
  const out: string[] = []
  let s = ''
  for (let i = 0; i < b.length; i++) {
    const c = b[i]
    if (c >= 0x20 && c < 0x7f) s += String.fromCharCode(c)
    else {
      if (s.length >= min) out.push(s)
      s = ''
    }
  }
  if (s.length >= min) out.push(s)
  return out
}

/** Read a CBOR text string (major type 3) at p. */
function cborText(b: Uint8Array, p: number): string | null {
  const h = b[p]
  if (h === undefined || h >> 5 !== 3) return null
  let len = h & 31
  let q = p + 1
  if (len === 24) len = b[q++]
  else if (len === 25) {
    len = u16be(b, q)
    q += 2
  } else if (len > 25) return null
  if (q + len > b.length) return null
  return utf8(b.subarray(q, q + len))
}

function indexesOf(b: Uint8Array, needle: string): number[] {
  const out: number[] = []
  const first = needle.charCodeAt(0)
  outer: for (let i = b.indexOf(first); i >= 0 && i + needle.length <= b.length; i = b.indexOf(first, i + 1)) {
    for (let k = 1; k < needle.length; k++) if (b[i + k] !== needle.charCodeAt(k)) continue outer
    out.push(i)
  }
  return out
}

function c2paFields(b: Uint8Array): Field[] {
  const out: Field[] = [{ key: 'C2PA manifest', value: `Content Credentials present (${b.length.toLocaleString('en-US')} bytes)`, ai: false }]
  const seen = new Set<string>()
  const add = (f: Field) => {
    const id = `${f.key}=${f.value}`
    if (!seen.has(id)) {
      seen.add(id)
      out.push(f)
    }
  }
  // claim_generator (v1): text value. claim_generator_info (v2) / softwareAgent: map with a "name" text.
  for (const key of ['claim_generator', 'softwareAgent']) {
    for (const i of indexesOf(b, key)) {
      const after = i + key.length
      let v = cborText(b, after)
      if (v === null) {
        const n = indexesOf(b.subarray(after, after + 64), 'name')[0]
        if (n !== undefined) v = cborText(b, after + n + 4)
      }
      if (v && v.length > 1) add(field(key === 'softwareAgent' ? 'C2PA software agent' : 'C2PA generator', v, true))
    }
  }
  // Model name in action parameters, e.g. Volcengine Ark: "model_name": "doubao-seedream-5-0-pro"
  for (const i of indexesOf(b, 'model_name')) {
    const v = cborText(b, i + 'model_name'.length)
    if (v && v.length > 1) add(field('C2PA model', v, true))
  }
  // Action descriptions, e.g. Google: "Created by Google Generative AI." / "Applied imperceptible SynthID watermark."
  for (const i of indexesOf(b, 'description')) {
    const v = cborText(b, i + 'description'.length)
    if (!v || v.length < 4) continue
    if (/synthid|watermark/i.test(v)) add({ key: 'C2PA action', value: v, ai: true, reason: 'an invisible watermark was added to the pixels; removing metadata does not remove it' })
    else add(field('C2PA action', v, true))
  }
  for (const r of strings(b)) {
    const st = r.match(/(trainedAlgorithmicMedia|compositeWithTrainedAlgorithmicMedia|algorithmicMedia|compositeSynthetic|algorithmicallyEnhanced)/)
    if (st) add({ key: 'C2PA digitalSourceType', value: st[1], ai: true, reason: sourceType(st[1]) })
    for (const act of r.matchAll(/c2pa\.(created|edited|opened|placed|converted|cropped|resized|color_adjustments|filtered|drawing)\b/g)) add({ key: 'C2PA action', value: act[0], ai: false })
  }
  if (!out.some((f) => f.ai)) {
    const s = strings(b).join(' ').match(STRONG)
    if (s) add({ key: 'C2PA text', value: s[0], ai: true, reason: `names an AI generator (${s[0]})` })
  }
  return out
}

function otherFields(blk: RawBlock): Field[] {
  const text = strings(blk.payload, 6).join(' ')
  const r = judge(text, false)
  return [{ key: blk.label, value: r ? short(text) : `${blk.size.toLocaleString('en-US')} bytes`, ai: !!r, reason: r }]
}

function blockFields(blk: RawBlock, aiTags: ExifTag[]): Field[] {
  switch (blk.kind) {
    case 'exif':
      return exifFields(blk, aiTags)
    case 'xmp':
      return xmpFields(utf8(blk.payload))
    case 'iptc':
      return iptcFields(blk.payload)
    case 'c2pa':
      return c2paFields(blk.payload)
    case 'text': {
      const key = blk.key ?? 'text'
      const value = utf8(blk.payload)
      const known = AI_TEXT_KEYS.has(key.toLowerCase())
      return [field(key, value, /software|source|generator/i.test(key), known ? `"${key}" is written by AI image tools` : undefined)]
    }
    case 'comment':
      return [field('Comment', utf8(blk.payload).replace(/\0+$/, '').trim())]
    default:
      return otherFields(blk)
  }
}

export function analyze(c: Container, bytes?: Uint8Array): Analysis {
  const exifAiTags = new Map<number, ExifTag[]>()
  const blocks: Block[] = c.blocks.map((blk) => {
    const aiTags: ExifTag[] = []
    const fields = blockFields(blk, aiTags)
    if (blk.kind === 'exif' && aiTags.length) exifAiTags.set(blk.id, aiTags)
    return { id: blk.id, kind: blk.kind, label: blk.label, size: blk.size, fields, ai: fields.some((f) => f.ai) }
  })
  for (const b of blocks) {
    if (b.kind !== 'xmp' && b.kind !== 'iptc') continue
    for (const f of b.fields) if (!f.ai && !f.privacy) f.privacy = namedPrivacy(f.key)
  }
  const signals = blocks.flatMap((b) => b.fields.filter((f) => f.ai).map((f) => ({ ...f, label: b.label })))
  const privacy: PrivacyItem[] = blocks.flatMap((b) => b.fields.filter((f) => f.privacy).map((f) => ({ kind: f.privacy!, key: f.key, value: f.value, label: b.label })))
  let verdict: Verdict = 'none'
  if (signals.length) verdict = 'ai'
  else if (blocks.some((b) => b.kind === 'c2pa')) verdict = 'provenance'
  else if (blocks.length) verdict = 'normal'
  const exif = c.blocks.find((b) => b.kind === 'exif')
  const orientation = exif ? orientationOf(exif.payload) : undefined

  let residual: string[] = []
  if (bytes) {
    const all = latin1(bytes)
    const inBlocks = c.blocks.map((b) => latin1(b.payload)).join('\n')
    residual = RESIDUAL_MARKERS.filter((m) => all.includes(m) && !inBlocks.includes(m))
  }
  return { scan: { format: c.format, blocks, verdict, signals, privacy, orientation, residual }, exifAiTags }
}
