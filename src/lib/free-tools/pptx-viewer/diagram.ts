// SmartArt pictures (icons, photos in shapes) live in the diagram drawing part and
// point at images through the drawing's own relationships. The renderer resolves
// them against the slide's relationships instead, so the pictures come out as
// black fills. Copy each drawing's image relationships into the slides that use
// it, under ids that can't collide, and point the drawing at those ids.
import { parseRels, relsPathFor, resolvePart } from "./xml";

const DRAWING = "/relationships/diagramDrawing";
const IMAGE = "/relationships/image";

/** Rels map keys may be the part or its .rels path; return the part. */
const partOf = (key: string) => (key.includes("/_rels/") ? key.replace("/_rels/", "/").replace(/\.rels$/, "") : key);

/**
 * Mutates `drawings` and `slideRels`. `drawingRels` maps a drawing's .rels path
 * to its XML. Returns how many drawings were rewritten.
 */
export function inlineDiagramImages(slideRels: Map<string, string>, drawings: Map<string, string>, drawingRels: Map<string, string>) {
  // drawing part → [new id, image part]
  const moved = new Map<string, [string, string][]>();
  let n = 0;
  for (const [drawing, xml] of drawings) {
    const rels = [...parseRels(drawingRels.get(relsPathFor(drawing))).values()].filter((r) => r.type.endsWith(IMAGE) && !r.external);
    if (!rels.length) continue;
    const tag = `ordDgm${++n}_`;
    let next = xml;
    for (const r of rels) next = next.replace(new RegExp(`(r:(?:embed|link)=")${r.id}"`, "g"), `$1${tag}${r.id}"`);
    drawings.set(drawing, next);
    moved.set(
      drawing,
      rels.map((r) => [tag + r.id, resolvePart(drawing, r.target)]),
    );
  }
  if (!moved.size) return 0;

  for (const [key, xml] of slideRels) {
    const slide = partOf(key);
    const add: string[] = [];
    for (const r of parseRels(xml).values()) {
      if (!r.type.endsWith(DRAWING)) continue;
      for (const [id, image] of moved.get(resolvePart(slide, r.target)) ?? []) {
        add.push(`<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${relativeTo(slide, image)}"/>`);
      }
    }
    if (add.length) slideRels.set(key, xml.replace("</Relationships>", `${add.join("")}</Relationships>`));
  }
  return moved.size;
}

/** `ppt/slides/slide1.xml`, `ppt/media/a.png` → `../media/a.png`. */
function relativeTo(fromPart: string, toPart: string) {
  const from = fromPart.split("/").slice(0, -1);
  const to = toPart.split("/");
  let i = 0;
  while (i < from.length && i < to.length - 1 && from[i] === to[i]) i++;
  return [...Array(from.length - i).fill(".."), ...to.slice(i)].join("/");
}
