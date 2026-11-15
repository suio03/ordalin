// Browser side of the pptx viewer: open a file, render slides into the page,
// check fonts, export PNG/ZIP/PDF. The renderer loads only when a file is opened,
// and nothing leaves the device.
import type { PptxFiles, PresentationData, SlideData, SlideHandle } from "@aiden0z/pptx-renderer";
import { readDeckInfo, type DeckInfo, type SlideInfo } from "@/lib/free-tools/pptx-viewer/deck";
import { unzipSync, strFromU8 } from "fflate";
import { inlineDiagramImages } from "@/lib/free-tools/pptx-viewer/diagram";
import { detectDeck, type DeckFormat, type DetectError } from "@/lib/free-tools/pptx-viewer/detect";
import { buildReport, type ReportRow } from "@/lib/free-tools/pptx-viewer/report";

type Lib = typeof import("@aiden0z/pptx-renderer");

/** Largest file we read into memory. Measured on desktop Chrome; see the ledger. */
export const MAX_FILE_MB = 300;
export const EXPORT_WIDTH = 1920;
/**
 * The renderer's recommended limits stop at 32 MB per part, which rejects decks
 * with one embedded video. Keep a zip-bomb ceiling, sized for what a 300 MB
 * file can honestly hold.
 */
const ZIP_LIMITS = {
  maxEntries: 10_000,
  maxEntryUncompressedBytes: 600 * 1048576,
  maxTotalUncompressedBytes: 1024 * 1048576,
  maxMediaBytes: 900 * 1048576,
  maxConcurrency: 8,
};

export type Slide = { data: SlideData; info: SlideInfo };
export type Deck = {
  name: string;
  format: DeckFormat;
  macros: boolean;
  width: number;
  height: number;
  slides: Slide[];
  report: ReportRow[];
  hasNotes: boolean;
  lib: Lib;
  pres: PresentationData;
  mediaUrlCache: Map<string, string>;
};
export type OpenResult = { ok: true; deck: Deck } | { ok: false; error: DetectError | "tooBig" | "failed"; detail?: string };

let libPromise: Promise<Lib> | null = null;
/** Starts the renderer download early (on hover or focus of the drop zone). */
export const preloadRenderer = () => (libPromise ??= import("@aiden0z/pptx-renderer"));

export async function openDeck(file: File): Promise<OpenResult> {
  if (file.size > MAX_FILE_MB * 1024 * 1024) return { ok: false, error: "tooBig", detail: `${Math.round(file.size / 1048576)} MB, limit ${MAX_FILE_MB} MB` };
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const kind = detectDeck(bytes, file.name);
  if (!kind.ok) return { ok: false, error: kind.error };

  try {
    const [lib, info] = [await preloadRenderer(), readDeckInfo(bytes)];
    const files = await lib.parseZip(buf, ZIP_LIMITS);
    const tiffShown = await convertTiffs(files);
    fixDiagramImages(files, bytes);
    const pres = lib.buildPresentation(files, { lazySlides: true });
    const byPath = new Map(info.slides.map((s) => [s.path, s]));
    const slides = pres.slides.map((data) => ({
      data,
      info: byPath.get(data.slidePath) ?? { path: data.slidePath, hidden: !!data.hidden, notes: null, issues: [], fonts: [] },
    }));
    const missing = missingFonts(info);
    return {
      ok: true,
      deck: {
        name: file.name,
        format: kind.format,
        macros: kind.macros,
        width: pres.width,
        height: pres.height,
        slides,
        report: buildReport(info, missing, tiffShown),
        hasNotes: slides.some((s) => s.info.notes),
        lib,
        pres,
        mediaUrlCache: new Map(),
      },
    };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    if (/limit|exceed|too (large|many)/i.test(detail)) return { ok: false, error: "tooBig", detail };
    return { ok: false, error: "failed", detail };
  }
}

export function closeDeck(deck: Deck) {
  for (const url of deck.mediaUrlCache.values()) URL.revokeObjectURL(url);
  deck.mediaUrlCache.clear();
}

/** Renders one slide at its natural size into `host`; scale the host with CSS. */
export function renderInto(deck: Deck, index: number, host: HTMLElement): SlideHandle {
  const handle = deck.lib.renderSlide(deck.pres, deck.slides[index].data, {
    externalMedia: "block",
    mediaUrlCache: deck.mediaUrlCache,
    onNodeError: () => {},
  });
  host.replaceChildren(handle.element);
  return handle;
}

/**
 * Browsers can't show TIFF pictures. Decode them to PNG and point every
 * relationship at the new part, so the renderer treats them as ordinary images.
 */
async function convertTiffs(files: PptxFiles) {
  const tiffs = [...files.media.keys()].filter((p) => /\.tiff?$/i.test(p));
  if (!tiffs.length) return true;
  let all = true;
  const { default: UTIF } = await import("utif2");
  const renamed = new Map<string, string>();
  for (const path of tiffs) {
    try {
      const data = files.media.get(path)!;
      const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
      const ifds = UTIF.decode(buffer);
      UTIF.decodeImage(buffer, ifds[0]);
      const rgba = UTIF.toRGBA8(ifds[0]);
      const canvas = document.createElement("canvas");
      canvas.width = ifds[0].width;
      canvas.height = ifds[0].height;
      canvas.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(rgba), canvas.width, canvas.height), 0, 0);
      const png = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
      if (!png) throw new Error("encode");
      files.media.set(`${path}.png`, new Uint8Array(await png.arrayBuffer()));
      files.media.delete(path);
      renamed.set(path.split("/").pop()!, `${path.split("/").pop()!}.png`);
    } catch {
      all = false;
    }
  }
  if (renamed.size) {
    for (const map of [files.slideRels, files.slideLayoutRels, files.slideMasterRels]) {
      for (const [key, xml] of map) {
        let next = xml;
        for (const [from, to] of renamed) next = next.replace(new RegExp(`(Target="[^"]*/)${escapeRe(from)}"`, "g"), `$1${to}"`);
        if (next !== xml) map.set(key, next);
      }
    }
  }
  return all;
}

/** SmartArt pictures: see `inlineDiagramImages`. */
function fixDiagramImages(files: PptxFiles, bytes: Uint8Array) {
  if (!files.diagramDrawings?.size) return;
  const raw = unzipSync(bytes, { filter: (f) => /^ppt\/diagrams\/_rels\/drawing[^/]*\.rels$/.test(f.name) });
  const rels = new Map(Object.entries(raw).map(([k, v]) => [k, strFromU8(v)]));
  inlineDiagramImages(files.slideRels, files.diagramDrawings, rels);
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Fonts the deck names that this device doesn't have (embedded fonts count as present). */
function missingFonts(info: DeckInfo) {
  const names = new Set([...info.themeFonts, ...info.slides.flatMap((s) => s.fonts)]);
  const embedded = new Set(info.embeddedFonts.map((f) => f.toLowerCase()));
  const ctx = document.createElement("canvas").getContext("2d");
  const missing = new Set<string>();
  if (!ctx) return missing;
  const sample = "mmmmmmmmmmlli1WQ@#аあ";
  const width = (font: string) => {
    ctx.font = font;
    return ctx.measureText(sample).width;
  };
  const bases = ["monospace", "serif", "sans-serif"].map((b) => [b, width(`72px ${b}`)] as const);
  for (const name of names) {
    if (embedded.has(name.toLowerCase())) continue;
    const quoted = `"${name.replace(/"/g, "")}"`;
    if (bases.every(([b, w]) => width(`72px ${quoted}, ${b}`) === w)) missing.add(name);
  }
  return missing;
}

/* ---------- Export ---------- */

async function settle(handle: SlideHandle, host: HTMLElement) {
  await handle.ready.catch(() => {});
  await Promise.all([...host.querySelectorAll("img")].map((img) => img.decode().catch(() => {})));
  await document.fonts.ready;
  // Charts draw with a short intro animation.
  if (host.querySelector("canvas")) await new Promise((r) => setTimeout(r, 1100));
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

/** Renders a slide off screen and returns it as a canvas `EXPORT_WIDTH` px wide. */
async function slideCanvas(deck: Deck, index: number) {
  const { domToCanvas } = await import("modern-screenshot");
  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-100000px;top:0;width:${deck.width}px;height:${deck.height}px;overflow:hidden;pointer-events:none;`;
  document.body.appendChild(host);
  const handle = renderInto(deck, index, host);
  try {
    await settle(handle, host);
    return await domToCanvas(handle.element, {
      width: deck.width,
      height: deck.height,
      scale: EXPORT_WIDTH / deck.width,
      backgroundColor: "#ffffff",
      filter: (node) => !(node instanceof HTMLVideoElement || node instanceof HTMLAudioElement),
    });
  } finally {
    handle.dispose();
    host.remove();
  }
}

const blobOf = (c: HTMLCanvasElement, type: string, q?: number) =>
  new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas"))), type, q));

export const baseName = (name: string) => name.replace(/\.[^.]+$/, "") || "slides";
const pad = (n: number, total: number) => String(n).padStart(Math.max(2, String(total).length), "0");

export async function exportPng(deck: Deck, index: number) {
  const blob = await blobOf(await slideCanvas(deck, index), "image/png");
  return { blob, name: `${baseName(deck.name)}-slide-${pad(index + 1, deck.slides.length)}.png` };
}

export async function exportZip(deck: Deck, onProgress: (n: number) => void) {
  const { zipSync } = await import("fflate");
  const entries: Record<string, Uint8Array> = {};
  for (let i = 0; i < deck.slides.length; i++) {
    onProgress(i + 1);
    const blob = await blobOf(await slideCanvas(deck, i), "image/png");
    entries[`slide-${pad(i + 1, deck.slides.length)}.png`] = new Uint8Array(await blob.arrayBuffer());
  }
  const zip = zipSync(entries, { level: 0 });
  return { blob: new Blob([zip as BlobPart], { type: "application/zip" }), name: `${baseName(deck.name)}-slides.zip` };
}

export async function exportPdf(deck: Deck, onProgress: (n: number) => void) {
  const { buildPdf } = await import("@/lib/free-tools/pptx-viewer/pdf");
  const pages = [];
  for (let i = 0; i < deck.slides.length; i++) {
    onProgress(i + 1);
    const canvas = await slideCanvas(deck, i);
    const jpeg = new Uint8Array(await (await blobOf(canvas, "image/jpeg", 0.92)).arrayBuffer());
    pages.push({ jpeg, pixelWidth: canvas.width, pixelHeight: canvas.height });
  }
  // Slide size is in CSS pixels (96 per inch); PDF pages are in points (72 per inch).
  const pdf = buildPdf(pages, Math.round(deck.width * 0.75), Math.round(deck.height * 0.75));
  return { blob: new Blob([pdf as BlobPart], { type: "application/pdf" }), name: `${baseName(deck.name)}.pdf` };
}

export function download({ blob, name }: { blob: Blob; name: string }) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
