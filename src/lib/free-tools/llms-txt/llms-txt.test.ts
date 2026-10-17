import { formatHints, renderLlmsTxt } from "./format";
import { cleanTitle, generateLlmsDraft, siteName } from "./generate";
import { parseSitemap, sectionFor, selectPages, titleFromPath } from "./pages";

const site = new URL("https://acme.com/");

describe("parseSitemap", () => {
  it("reads url sets, sitemap indexes, CDATA and entities", () => {
    const urlset = parseSitemap(`<urlset><url><loc>https://acme.com/a?x=1&amp;y=2</loc><lastmod>2026-01-02</lastmod></url><url><loc><![CDATA[https://acme.com/b]]></loc></url></urlset>`);
    expect(urlset).toEqual({ kind: "urlset", entries: [{ url: "https://acme.com/a?x=1&y=2", lastmod: "2026-01-02" }, { url: "https://acme.com/b", lastmod: null }] });
    expect(parseSitemap(`<sitemapindex><sitemap><loc>https://acme.com/pages.xml</loc></sitemap></sitemapindex>`).kind).toBe("index");
  });
});

describe("selectPages", () => {
  const entries = [
    "https://acme.com/",
    "https://www.acme.com/pricing",
    "https://acme.com/pricing/",
    "https://acme.com/docs/getting-started",
    "https://acme.com/login",
    "https://acme.com/blog/tag/ai",
    "https://acme.com/de/pricing",
    "https://acme.com/ai",
    "https://acme.com/features?ref=nav",
    "https://other.com/page",
    "https://acme.com/private/report",
    "https://acme.com/privacy",
    "https://acme.com/blog/old",
    "https://acme.com/blog/new",
  ].map((url) => ({ url, lastmod: url.endsWith("new") ? "2026-09-01" : url.endsWith("old") ? "2024-01-01" : null }));

  it("keeps same-site pages, explains every exclusion and orders by section", () => {
    const { candidates, excluded } = selectPages(entries, site, "User-agent: *\nDisallow: /private/", 40);
    expect(candidates.map((page) => [new URL(page.url).pathname, page.section])).toEqual([
      ["/docs/getting-started", "Docs"],
      ["/pricing", "Product"],
      ["/ai", "Pages"],
      ["/blog/new", "Blog"],
      ["/blog/old", "Blog"],
      ["/privacy", "Optional"],
    ]);
    expect(Object.fromEntries(excluded.map((page) => [new URL(page.url).pathname, page.reason]))).toEqual({
      "/login": "Sign-in or account page",
      "/blog/tag/ai": "Archive listing",
      "/de/pricing": "Translated copy",
      "/features": "Has query parameters",
      "/page": "Different site",
      "/private/report": "Blocked by robots.txt",
    });
  });

  it("counts pages beyond the limit instead of listing them", () => {
    const many = Array.from({ length: 30 }, (_, index) => ({ url: `https://acme.com/blog/post-${index}`, lastmod: null }));
    const { candidates, omitted } = selectPages(many, site, null, 40);
    expect(candidates).toHaveLength(6);
    expect(omitted).toBe(24);
  });

  it("takes top-level pages first and caps child pages per parent", () => {
    const list = [
      ...Array.from({ length: 6 }, (_, index) => `https://acme.com/integrations/app-${index}`),
      "https://acme.com/pricing",
      "https://acme.com/categories/writing",
    ].map((url) => ({ url, lastmod: null }));
    const { candidates, omitted } = selectPages(list, site, null, 40);
    expect(candidates.map((page) => new URL(page.url).pathname)).toEqual([
      "/pricing",
      "/integrations/app-0",
      "/integrations/app-1",
      "/integrations/app-2",
      "/categories/writing",
    ]);
    expect(omitted).toBe(3);
  });
});

describe("names and titles", () => {
  it("finds the product name and strips it from page titles", () => {
    expect(siteName(`<title>Granola — AI notepad for meetings</title>`, "www.granola.ai")).toBe("Granola");
    expect(siteName(`<meta property="og:site_name" content="Acme Notes"><title>x</title>`, "acme.com")).toBe("Acme Notes");
    expect(siteName(null, "acme.com")).toBe("Acme");
    expect(cleanTitle("Pricing | Granola", "Granola")).toBe("Pricing");
    expect(titleFromPath("/docs/getting-started")).toBe("Getting started");
    expect(sectionFor("/terms-of-service")).toBe("Optional");
  });
});

describe("renderLlmsTxt", () => {
  it("writes the llmstxt.org layout and passes its own format hints", () => {
    const text = renderLlmsTxt({
      name: "Acme",
      summary: "Meeting notes\nfor teams.",
      pages: [
        { url: "https://acme.com/privacy", title: "Privacy", description: null, section: "Optional" },
        { url: "https://acme.com/docs/a(b)", title: "Docs [beta]", description: "How it works.", section: "Docs" },
      ],
    });
    expect(text).toBe("# Acme\n\n> Meeting notes for teams.\n\n## Docs\n\n- [Docs beta](https://acme.com/docs/a%28b%29): How it works.\n\n## Optional\n\n- [Privacy](https://acme.com/privacy)\n");
    expect(formatHints(text).every((hint) => hint.ok)).toBe(true);
    expect(formatHints("Acme\n- [A](/a)").map((hint) => hint.ok)).toEqual([false, false, false]);
  });
});

describe("generateLlmsDraft", () => {
  it("builds a draft from the sitemap and drops broken and redirected pages", async () => {
    const pages: Record<string, Response | (() => Response)> = {
      "https://acme.com/": () => new Response(`<title>Acme | Notes for teams</title><meta name="description" content="Acme turns meetings into notes.">`, { headers: { "content-type": "text/html" } }),
      "https://acme.com/robots.txt": () => new Response("Sitemap: https://acme.com/sitemap.xml"),
      "https://acme.com/sitemap.xml": () => new Response(`<urlset>${["pricing", "gone", "old", "docs"].map((path) => `<url><loc>https://acme.com/${path}</loc></url>`).join("")}</urlset>`),
      "https://acme.com/pricing": () => new Response(`<title>Pricing | Acme</title><meta name="description" content="Plans.">`, { headers: { "content-type": "text/html" } }),
      "https://acme.com/gone": () => new Response("", { status: 404 }),
      "https://acme.com/old": () => new Response(null, { status: 301, headers: { location: "/" } }),
      "https://acme.com/docs": () => new Response(`<title>Docs - Acme</title>`, { headers: { "content-type": "text/html" } }),
    };
    const fetcher = (async (input: RequestInfo | URL) => {
      const page = pages[String(input)];
      return typeof page === "function" ? page() : new Response("", { status: 404 });
    }) as typeof fetch;

    const draft = await generateLlmsDraft(site, fetcher, new Date("2026-10-17T00:00:00Z"));
    expect(draft.name).toBe("Acme");
    expect(draft.summary).toBe("Acme turns meetings into notes.");
    expect(draft.pages).toEqual([
      { url: "https://acme.com/docs", title: "Docs", description: null, section: "Docs" },
      { url: "https://acme.com/pricing", title: "Pricing", description: "Plans.", section: "Product" },
    ]);
    expect(draft.excluded).toEqual([
      { url: "https://acme.com/gone", reason: "HTTP 404" },
      { url: "https://acme.com/old", reason: "Redirects to the homepage" },
    ]);
  });
});
