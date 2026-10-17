import { checkOgImage } from "./check";
import { imageInfo } from "./image";

function png(width: number, height: number) {
  const bytes = new Uint8Array(33);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  return bytes;
}

function jpeg(width: number, height: number) {
  // SOI, an APP0 segment to skip, then SOF0 with the size.
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xc0, 0, 17, 8, height >> 8, height & 255, width >> 8, width & 255, 3]);
}

function webp(width: number, height: number) {
  const bytes = new Uint8Array(30);
  bytes.set([..."RIFF"].map((c) => c.charCodeAt(0)), 0);
  bytes.set([..."WEBPVP8X"].map((c) => c.charCodeAt(0)), 8);
  const w = width - 1;
  const h = height - 1;
  bytes.set([w & 255, (w >> 8) & 255, (w >> 16) & 255, h & 255, (h >> 8) & 255, (h >> 16) & 255], 24);
  return bytes;
}

describe("imageInfo", () => {
  it("reads the size of PNG, JPEG, GIF and WebP files", () => {
    expect(imageInfo(png(1200, 630))).toEqual({ format: "png", width: 1200, height: 630 });
    expect(imageInfo(jpeg(1920, 1005))).toEqual({ format: "jpeg", width: 1920, height: 1005 });
    expect(imageInfo(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x58, 0x02, 0x3b, 0x01]))).toEqual({ format: "gif", width: 600, height: 315 });
    expect(imageInfo(webp(1200, 630))).toEqual({ format: "webp", width: 1200, height: 630 });
    expect(imageInfo(new TextEncoder().encode('<?xml version="1.0"?>\n<svg width="1200">'))).toEqual({ format: "svg", width: null, height: null });
    expect(imageInfo(new TextEncoder().encode("<!doctype html>")).format).toBeNull();
  });
});

describe("checkOgImage", () => {
  const html = (head: string) => () => new Response(`<!doctype html><html><head>${head}</head><body></body></html>`, { headers: { "content-type": "text/html; charset=utf-8" } });
  const image = (bytes: Uint8Array, type = "image/png") => () => new Response(bytes as Uint8Array<ArrayBuffer>, { headers: { "content-type": type, "content-length": String(bytes.byteLength) } });
  function fetcherFor(routes: Record<string, () => Response>) {
    return (async (input: RequestInfo | URL) => routes[String(input)]?.() ?? new Response("", { status: 404 })) as typeof fetch;
  }
  const statuses = (checks: Array<{ id: string; status: string }>) => Object.fromEntries(checks.map((check) => [check.id, check.status]));

  it("passes a page with complete tags and a 1200 × 630 image", async () => {
    const report = await checkOgImage(
      new URL("https://acme.com/pricing"),
      fetcherFor({
        "https://acme.com/pricing": html(`
          <title>Pricing</title><link rel="canonical" href="https://acme.com/pricing">
          <meta property="og:title" content="Acme pricing"><meta property="og:description" content="Plans for teams.">
          <meta property="og:url" content="https://acme.com/pricing"><meta property="og:image" content="https://cdn.acme.com/og.png">
          <meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
          <meta property="og:type" content="website"><meta property="og:site_name" content="Acme"><meta property="og:image:alt" content="Acme">
          <meta name="twitter:card" content="summary_large_image">`),
        "https://cdn.acme.com/og.png": image(png(1200, 630)),
      }),
    );
    expect(report.found).toBe(true);
    expect(statuses(report.checks)).toEqual({
      page: "pass",
      "og-image": "pass",
      "image-load": "pass",
      "image-size": "pass",
      "image-file": "pass",
      "og-title": "pass",
      "og-description": "pass",
      "og-url": "pass",
      "twitter-card": "pass",
      "og-extras": "info",
    });
    expect(report.preview).toMatchObject({ domain: "acme.com", title: "Acme pricing", image: "https://cdn.acme.com/og.png", imageWidth: 1200 });
  });

  it("reports a relative, small image, wrong size tags and missing tags", async () => {
    const report = await checkOgImage(
      new URL("https://acme.com/"),
      fetcherFor({
        "https://acme.com/": html(`<title>Acme</title><link rel="canonical" href="https://acme.com/"><meta property="og:url" content="https://acme.com/home">
          <meta property="og:image" content="/og.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">`),
        "https://acme.com/og.jpg": image(jpeg(500, 500), "image/jpeg"),
      }),
    );
    expect(statuses(report.checks)).toMatchObject({
      "og-image": "warn",
      "image-load": "pass",
      "image-size": "warn",
      "image-file": "pass",
      "og-title": "warn",
      "og-description": "warn",
      "og-url": "warn",
      "twitter-card": "warn",
    });
    const size = report.checks.find((check) => check.id === "image-size");
    expect(size?.summary).toMatch(/small thumbnail/);
    expect(size?.summary).toMatch(/say 1200 × 630, but the image is 500 × 500/);
  });

  it("fails a missing image, an SVG and a page that does not load", async () => {
    const missing = await checkOgImage(new URL("https://acme.com/"), fetcherFor({ "https://acme.com/": html("<title>Acme</title>") }));
    expect(statuses(missing.checks)).toMatchObject({ "og-image": "fail", "og-title": "warn" });
    expect(missing.checks.some((check) => check.id === "image-load")).toBe(false);

    const svg = await checkOgImage(
      new URL("https://acme.com/"),
      fetcherFor({
        "https://acme.com/": html(`<meta property="og:image" content="https://acme.com/og.svg">`),
        "https://acme.com/og.svg": image(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>"), "image/svg+xml"),
      }),
    );
    expect(statuses(svg.checks)).toMatchObject({ "image-load": "pass", "image-size": "info", "image-file": "fail" });
    expect(svg.preview?.image).toBeNull();

    const broken = await checkOgImage(new URL("https://acme.com/missing"), fetcherFor({}));
    expect(broken.found).toBe(false);
    expect(broken.checks).toHaveLength(1);
    expect(broken.checks[0].summary).toBe("The page did not load (HTTP 404).");
  });
});
