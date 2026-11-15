// Groups per-slide issues into the "what may look different" list.
import type { DeckInfo, Issue } from "./deck";

export type ReportRow = { issue: Issue | { kind: "fonts"; fonts: string[] }; slides: number[] | "deck" };

export function buildReport(info: DeckInfo, missing: Set<string>, tiffShown: boolean): ReportRow[] {
  const rows = new Map<string, ReportRow>();
  info.slides.forEach((slide, i) => {
    for (const issue of slide.issues) {
      if (issue.kind === "image" && issue.ext === "tiff" && tiffShown) continue;
      // EMF and WMF share one line.
      const key = issue.kind === "image" && issue.ext !== "tiff" ? "image:metafile" : JSON.stringify(issue);
      const row = rows.get(key) ?? { issue, slides: [] };
      if (row.slides !== "deck" && !row.slides.includes(i + 1)) row.slides.push(i + 1);
      rows.set(key, row);
    }
  });

  const themeMissing = info.themeFonts.filter((f) => missing.has(f));
  const fontSlides: number[] = [];
  const fonts = new Set(themeMissing);
  info.slides.forEach((slide, i) => {
    const gone = slide.fonts.filter((f) => missing.has(f));
    for (const f of gone) fonts.add(f);
    if (gone.length) fontSlides.push(i + 1);
  });
  const out = [...rows.values()];
  if (fonts.size) out.push({ issue: { kind: "fonts", fonts: [...fonts] }, slides: themeMissing.length ? "deck" : fontSlides });
  return out;
}

/** 1, 2, 3, 5, 8, 9 → "1–3, 5, 8, 9". */
export function slideRanges(slides: number[]) {
  const parts: string[] = [];
  const sorted = [...slides].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    parts.push(j - i >= 2 ? `${sorted[i]}–${sorted[j]}` : sorted.slice(i, j + 1).join(", "));
    i = j;
  }
  return parts.join(", ");
}
