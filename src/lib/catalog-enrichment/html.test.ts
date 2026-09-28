import { extractPage } from "./html";

describe("catalogue HTML asset discovery", () => {
  it("finds icons, manifest, page logos, and Organization structured logos", () => {
    const page = extractPage(
      `<!doctype html><html><head>
        <link rel="shortcut icon" href="/favicon.ico">
        <link rel="apple-touch-icon" href="/apple.png">
        <link rel="manifest" href="/site.webmanifest">
        <script data-schema="organization" type="application/ld+json">
          {"@type":"Organization","logo":{"url":"/structured-logo.png"}}
        </script>
        <meta property="og:image" content="/share.jpg">
      </head><body><img alt="Example logo" src="/logo.svg"></body></html>`,
      "https://example.com/product",
    );

    expect(page.manifestUrl).toBe("https://example.com/site.webmanifest");
    expect(page.assets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "logo", value: "https://example.com/structured-logo.png" }),
        expect.objectContaining({ kind: "logo", value: "https://example.com/apple.png" }),
        expect.objectContaining({ kind: "logo", value: "https://example.com/logo.svg" }),
        expect.objectContaining({ kind: "icon", value: "https://example.com/favicon.ico" }),
        expect.objectContaining({ kind: "social_preview", value: "https://example.com/share.jpg" }),
      ]),
    );
  });

  it("finds logos inside a JSON-LD graph", () => {
    const page = extractPage(
      `<script type="application/ld+json">{"@graph":[{"@type":"WebSite","logo":"/brand.svg"}]}</script>`,
      "https://example.com",
    );
    expect(page.assets[0]).toMatchObject({ kind: "logo", value: "https://example.com/brand.svg" });
  });
});

it("keeps meaningful body evidence when CSS and scripts exceed the excerpt budget", () => {
  const page = extractPage(`<style>${".noise{color:red}".repeat(2000)}</style><script>${"fake free plan;".repeat(2000)}</script><h1>Pro &#x26; teams</h1><p>Pro costs $12 per user per month.</p><noscript>Enable JavaScript</noscript><svg><text>decoration</text></svg>`, "https://example.com/");
  expect(page.searchableText).toBe("Pro & teams Pro costs $12 per user per month.");
  expect(page.headings).toEqual(["Pro & teams"]);
});
