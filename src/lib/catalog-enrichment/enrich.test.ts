import { enrichCatalogSite } from "./enrich";

const homepage = `<!doctype html><html><head>
  <title>Lispr — Voice to text</title>
  <meta property="og:site_name" content="Lispr">
  <meta name="description" content="Push-to-talk dictation for desktop apps.">
  <link rel="icon" href="/favicon.png">
  <link rel="apple-touch-icon" href="/logo.png">
  <script type="application/ld+json">{"@type":"SoftwareApplication","name":"Lispr","operatingSystem":"macOS, Windows"}</script>
</head><body><h1>Talk. It types.</h1><p>Unlike a browser extension, Lispr works across apps.</p><a href="/pricing">Pricing</a><a href="https://other.example/docs">Docs</a></body></html>`;

function mockFetch(input: string | URL | Request) {
  const url = String(input);
  if (url.endsWith("/robots.txt")) return Promise.resolve(new Response("User-agent: *\nDisallow:"));
  if (url.endsWith("/pricing")) {
    return Promise.resolve(new Response("<html><head><title>Pricing</title></head><body><h1>Plans</h1><p>Start for free.</p></body></html>", { headers: { "content-type": "text/html" } }));
  }
  return Promise.resolve(new Response(homepage, { headers: { "content-type": "text/html" } }));
}

describe("bounded catalogue enrichment", () => {
  it("collects review candidates without following off-site links", async () => {
    const candidate = await enrichCatalogSite("https://lispr.example/", {
      fetcher: mockFetch as typeof fetch,
      fetchedAt: new Date("2026-08-23T00:00:00Z"),
    });
    expect(candidate.status).toBe("pending_review");
    expect(candidate.identity.name?.value).toBe("Lispr");
    expect(candidate.identity.tagline?.value).toBe("Push-to-talk dictation for desktop apps.");
    expect(candidate.platforms.map((item) => item.value)).toEqual(["macOS", "Windows"]);
    expect(candidate.assets.map((item) => item.value)).toContain("https://lispr.example/logo.png");
    expect(candidate.pricingSignals[0]?.value).toBe("freemium");
    expect(candidate.evidencePages.map((page) => page.role)).toEqual(["homepage", "pricing"]);
    expect(candidate.evidencePages[0]?.excerpt).toContain("Talk. It types.");
  });

  it("rejects local and non-HTTPS targets", async () => {
    await expect(enrichCatalogSite("http://example.com", { fetcher: mockFetch as typeof fetch })).rejects.toThrow("HTTPS");
    await expect(enrichCatalogSite("https://127.0.0.1", { fetcher: mockFetch as typeof fetch })).rejects.toThrow("Private");
  });
});

it("researches pricing before feature navigation and follows linked help articles on official subdomains", async () => {
  const pages: Record<string, string> = {
    "https://example.com/": '<h1>Example</h1><a href="/features">Features</a><a href="/pricing">Pricing</a><a href="https://docs.example.com/">Help</a><a href="https://outsider.example/docs">Docs</a>',
    "https://example.com/pricing": '<h1>Plans</h1><p>Free plan: 10 exports per month.</p>',
    "https://example.com/features": '<h1>Features</h1>',
    "https://docs.example.com/": '<a href="/export-guide">Export guide</a>',
    "https://docs.example.com/export-guide": '<h1>Export limits</h1><p>Exports do not include audio.</p>',
  };
  const requested: string[] = [];
  const fetcher = async (input: string | URL | Request) => {
    const url = String(input); requested.push(url);
    if (url.endsWith("/robots.txt")) return new Response("User-agent: *\nDisallow:");
    return new Response(pages[url] ?? "", { status: pages[url] ? 200 : 404, headers: { "content-type": "text/html" } });
  };
  const result = await enrichCatalogSite("https://example.com/", { research: true, fetcher: fetcher as typeof fetch });
  expect(result.evidencePages[1].role).toBe("pricing");
  expect(result.evidencePages.some(page => page.url === "https://docs.example.com/export-guide")).toBe(true);
  expect(requested).toContain("https://docs.example.com/robots.txt");
  expect(requested.some(url => url.includes("outsider.example"))).toBe(false);
});

it("skips document and plain-HTTP links instead of recording crawl warnings", async () => {
  const requested: string[] = [];
  const fetcher = async (input: string | URL | Request) => {
    const url = String(input); requested.push(url);
    if (url.endsWith("/robots.txt")) return new Response("User-agent: *\nDisallow:");
    return new Response('<h1>Example</h1><a href="/security-report.pdf">Security</a><a href="http://example.com/privacy">Privacy</a>', { headers: { "content-type": "text/html" } });
  };
  const result = await enrichCatalogSite("https://example.com/", { research: true, fetcher: fetcher as typeof fetch });
  expect(result.warnings).toEqual([]);
  expect(requested.some(url => url.endsWith(".pdf") || url.startsWith("http:"))).toBe(false);
});
