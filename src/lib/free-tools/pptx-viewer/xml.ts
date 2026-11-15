// Small string helpers for the few OOXML parts the viewer reads itself (notes,
// relationships, inventory). The renderer parses everything else. Kept free of
// DOMParser so the same code runs in tests.

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

export function decodeXml(s: string) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/** Attribute value from the inside of a start tag (`<a:latin typeface="X"/>` → X). */
export function attr(tag: string, name: string) {
  const m = new RegExp(`(?:^|\\s)${name.replace(":", "\\:")}\\s*=\\s*("([^"]*)"|'([^']*)')`).exec(tag);
  return m ? decodeXml(m[2] ?? m[3] ?? "") : undefined;
}

export type Rel = { id: string; type: string; target: string; external: boolean };

export function parseRels(xml: string | undefined): Map<string, Rel> {
  const out = new Map<string, Rel>();
  if (!xml) return out;
  for (const m of xml.matchAll(/<Relationship\b([^>]*?)\/?>/g)) {
    const id = attr(m[1], "Id");
    const type = attr(m[1], "Type") ?? "";
    const target = attr(m[1], "Target") ?? "";
    if (id) out.set(id, { id, type, target, external: (attr(m[1], "TargetMode") ?? "").toLowerCase() === "external" });
  }
  return out;
}

/** `ppt/slides/slide1.xml` + `../media/a.png` → `ppt/media/a.png`. */
export function resolvePart(fromPart: string, target: string) {
  if (target.startsWith("/")) return normalize(target.slice(1));
  const dir = fromPart.split("/").slice(0, -1);
  return normalize([...dir, target].join("/"));
}

function normalize(path: string) {
  const out: string[] = [];
  for (const seg of path.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") out.pop();
    else out.push(seg);
  }
  let joined = out.join("/");
  try {
    joined = decodeURIComponent(joined);
  } catch {
    // keep the raw name
  }
  return joined;
}

/** `ppt/slides/slide1.xml` → `ppt/slides/_rels/slide1.xml.rels`. */
export function relsPathFor(part: string) {
  const i = part.lastIndexOf("/");
  return `${part.slice(0, i)}/_rels/${part.slice(i + 1)}.rels`;
}

export const extOf = (path: string) => (path.split(/[?#]/)[0].split(".").pop() ?? "").toLowerCase();
