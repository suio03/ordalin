// Reads what the renderer does not expose: speaker notes, and a per-slide list of
// things the browser view cannot show as PowerPoint would (the "not rendered" list).
import { unzipSync } from "fflate";
import { attr, decodeXml, extOf, parseRels, relsPathFor, resolvePart } from "./xml";

export type Issue =
  | { kind: "media"; media: "video" | "audio"; ext: string; status: "plays" | "unsupported" | "linked" }
  | { kind: "ole" }
  | { kind: "smartart" }
  | { kind: "animation" }
  | { kind: "image"; ext: "tiff" | "emf" | "wmf" }
  | { kind: "ink" };

export type SlideInfo = { path: string; hidden: boolean; notes: string | null; issues: Issue[]; fonts: string[] };
export type DeckInfo = {
  /** Slides in presentation order. */
  slides: SlideInfo[];
  /** Theme heading and body fonts, used by most text that names no font. */
  themeFonts: string[];
  /** Fonts the file carries itself; these never fall back. */
  embeddedFonts: string[];
};

const PLAYABLE = { video: ["mp4", "m4v", "webm"], audio: ["mp3", "m4a", "wav", "ogg"] } as const;
const REL = (type: string, name: string) => type.endsWith(`/${name}`);
const td = new TextDecoder();

function wanted(name: string) {
  return (
    name === "ppt/presentation.xml" ||
    name === "ppt/_rels/presentation.xml.rels" ||
    /^ppt\/slides\/(_rels\/)?slide\d+\.xml(\.rels)?$/.test(name) ||
    /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(name) ||
    /^ppt\/slideMasters\/_rels\/slideMaster\d+\.xml\.rels$/.test(name) ||
    /^ppt\/theme\/theme\d+\.xml$/.test(name)
  );
}

export function readDeckInfo(bytes: Uint8Array): DeckInfo {
  const raw = unzipSync(bytes, { filter: (f) => wanted(f.name) });
  const text = (path: string) => (raw[path] ? td.decode(raw[path]) : undefined);

  const presentation = text("ppt/presentation.xml") ?? "";
  const presRels = parseRels(text("ppt/_rels/presentation.xml.rels"));

  const order: string[] = [];
  const idList = /<p:sldIdLst\b[^>]*>([\s\S]*?)<\/p:sldIdLst>/.exec(presentation)?.[1] ?? "";
  for (const m of idList.matchAll(/<p:sldId\b([^>]*)\/?>/g)) {
    const rel = presRels.get(attr(m[1], "r:id") ?? "");
    if (rel) order.push(resolvePart("ppt/presentation.xml", rel.target));
  }

  const slides = order.map((path) => slideInfo(path, text(path) ?? "", text));

  const themeFonts = new Set<string>();
  for (const name of Object.keys(raw)) {
    if (!name.startsWith("ppt/slideMasters/_rels/")) continue;
    for (const rel of parseRels(text(name)).values()) {
      if (!REL(rel.type, "theme")) continue;
      const theme = text(resolvePart(name.replace("_rels/", "").replace(/\.rels$/, ""), rel.target)) ?? "";
      for (const m of theme.matchAll(/<a:(?:major|minor)Font>\s*<a:latin\b([^>]*)\/?>/g)) {
        const face = attr(m[1], "typeface");
        if (face) themeFonts.add(face);
      }
    }
  }

  const embeddedFonts = [...presentation.matchAll(/<p:embeddedFont>\s*<p:font\b([^>]*)\/?>/g)]
    .map((m) => attr(m[1], "typeface"))
    .filter((f): f is string => !!f);

  return { slides, themeFonts: [...themeFonts], embeddedFonts };
}

function slideInfo(path: string, xml: string, text: (p: string) => string | undefined): SlideInfo {
  const rels = parseRels(text(relsPathFor(path)));
  const hidden = /<p:sld\b[^>]*\bshow\s*=\s*"(0|false)"/.test(xml);

  let notes: string | null = null;
  for (const rel of rels.values()) {
    if (REL(rel.type, "notesSlide")) notes = notesText(text(resolvePart(path, rel.target)) ?? "");
  }

  return { path, hidden, notes, issues: slideIssues(path, xml, rels), fonts: slideFonts(xml) };
}

/** Text of the notes body placeholder, one line per paragraph. */
export function notesText(xml: string): string | null {
  const parts: string[] = [];
  for (const sp of xml.matchAll(/<p:sp\b[\s\S]*?<\/p:sp>/g)) {
    if (!/<p:ph\b[^>]*\btype\s*=\s*"body"/.test(sp[0])) continue;
    for (const p of sp[0].matchAll(/<a:p\b[^>]*?(?:\/>|>([\s\S]*?)<\/a:p>)/g)) {
      const body = p[1] ?? "";
      let line = "";
      for (const t of body.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>|<a:br\b[^>]*\/?>|<a:tab\b[^>]*\/?>/g)) {
        if (t[1] !== undefined) line += decodeXml(t[1]);
        else line += t[0].startsWith("<a:br") ? "\n" : "\t";
      }
      parts.push(line.replace(/\s+$/, ""));
    }
  }
  const out = parts.join("\n").replace(/^\n+|\n+$/g, "");
  return out.trim() ? out : null;
}

function slideIssues(path: string, xml: string, rels: ReturnType<typeof parseRels>): Issue[] {
  const issues: Issue[] = [];

  // Video and audio: prefer the embedded part (p14:media) over a link.
  for (const pic of xml.matchAll(/<p:pic\b[\s\S]*?<\/p:pic>/g)) {
    const kind = /<a:(videoFile|quickTimeFile)\b/.test(pic[0]) ? "video" : /<a:(audioFile|wavAudioFile)\b/.test(pic[0]) ? "audio" : null;
    if (!kind) continue;
    const ids = [...pic[0].matchAll(/<(?:p14:media|a:videoFile|a:quickTimeFile|a:audioFile|a:wavAudioFile)\b([^>]*)\/?>/g)].flatMap((m) =>
      [attr(m[1], "r:embed"), attr(m[1], "r:link")].filter((x): x is string => !!x),
    );
    const targets = ids.map((id) => rels.get(id)).filter((r) => !!r);
    const embedded = targets.find((r) => !r.external);
    if (!embedded) {
      issues.push({ kind: "media", media: kind, ext: extOf(targets[0]?.target ?? ""), status: "linked" });
      continue;
    }
    const ext = extOf(embedded.target);
    // The file's type wins over the tag: some tools store an MP3 as a "video".
    const media = (PLAYABLE.audio as readonly string[]).includes(ext) ? "audio" : (PLAYABLE.video as readonly string[]).includes(ext) ? "video" : kind;
    issues.push({ kind: "media", media, ext, status: (PLAYABLE[media] as readonly string[]).includes(ext) ? "plays" : "unsupported" });
  }

  if (/<p:oleObj\b/.test(xml)) issues.push({ kind: "ole" });

  const smartArt = (xml.match(/<dgm:relIds\b/g) ?? []).length;
  const drawings = [...rels.values()].filter((r) => REL(r.type, "diagramDrawing")).length;
  if (smartArt > drawings) issues.push({ kind: "smartart" });

  const timing = /<p:timing\b[\s\S]*?<\/p:timing>/.exec(xml)?.[0] ?? "";
  if (/<p:(anim\w*|set)\b/.test(timing)) issues.push({ kind: "animation" });

  if (/<(p|p14):contentPart\b/.test(xml)) issues.push({ kind: "ink" });

  const seen = new Set<string>();
  for (const rel of rels.values()) {
    if (rel.external || !REL(rel.type, "image")) continue;
    const ext = extOf(resolvePart(path, rel.target));
    const norm = ext === "tif" ? "tiff" : ext;
    if ((norm === "tiff" || norm === "emf" || norm === "wmf") && !seen.has(norm)) {
      seen.add(norm);
      issues.push({ kind: "image", ext: norm });
    }
  }
  return issues;
}

function slideFonts(xml: string) {
  const out = new Set<string>();
  for (const m of xml.matchAll(/<a:(?:latin|ea|cs|buFont)\b([^>]*)\/?>/g)) {
    const face = attr(m[1], "typeface");
    if (face && !face.startsWith("+")) out.add(face);
  }
  return [...out];
}
