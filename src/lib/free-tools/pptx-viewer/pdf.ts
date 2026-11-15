// A minimal PDF writer: one JPEG image per page, page size in points. Enough for
// "save the deck as PDF" without a PDF library.

export type PdfPage = { jpeg: Uint8Array; pixelWidth: number; pixelHeight: number };

const enc = new TextEncoder();

export function buildPdf(pages: PdfPage[], pageWidthPt: number, pageHeightPt: number): Uint8Array {
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let size = 0;
  const push = (part: string | Uint8Array) => {
    const bytes = typeof part === "string" ? enc.encode(part) : part;
    chunks.push(bytes);
    size += bytes.length;
  };
  const object = (n: number, body: () => void) => {
    offsets[n] = size;
    push(`${n} 0 obj\n`);
    body();
    push("\nendobj\n");
  };

  const w = round(pageWidthPt);
  const h = round(pageHeightPt);
  // 1 catalog, 2 page tree, then 3 objects per page: page, content, image.
  const pageObj = (i: number) => 3 + i * 3;

  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  object(1, () => push("<< /Type /Catalog /Pages 2 0 R >>"));
  object(2, () => push(`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, i) => `${pageObj(i)} 0 R`).join(" ")}] >>`));
  pages.forEach((page, i) => {
    const n = pageObj(i);
    object(n, () =>
      push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 ${n + 2} 0 R >> >> /Contents ${n + 1} 0 R >>`),
    );
    const content = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`;
    object(n + 1, () => push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
    object(n + 2, () => {
      push(
        `<< /Type /XObject /Subtype /Image /Width ${page.pixelWidth} /Height ${page.pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`,
      );
      push(page.jpeg);
      push("\nendstream");
    });
  });

  const count = 3 + pages.length * 3;
  const xref = size;
  push(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for (let n = 1; n < count; n++) push(`${String(offsets[n]).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

  const out = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

const round = (n: number) => Math.round(n * 100) / 100;
