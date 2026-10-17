import { buildVisibilityReport, type VisibilityInput } from "./checks";

const goodHtml = `<!doctype html><html><head>
<title>Acme notes</title>
<meta name="description" content="Acme turns meetings into notes.">
<link rel="canonical" href="https://acme.com/">
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","name":"Acme"}]}</script>
</head><body><h1>Meeting notes</h1><p>${"word ".repeat(200)}</p><script>${"ignored ".repeat(500)}</script></body></html>`;

function input(overrides: Partial<VisibilityInput> = {}): VisibilityInput {
  return {
    website: "https://acme.com/",
    page: { status: 200, url: "https://acme.com/", body: goodHtml, contentType: "text/html" },
    robots: { status: 200, url: "https://acme.com/robots.txt", body: "User-agent: GPTBot\nDisallow: /\n\nSitemap: https://acme.com/sitemap.xml" },
    llms: { status: 404, url: "https://acme.com/llms.txt" },
    sitemap: { status: 200, url: "https://acme.com/sitemap.xml" },
    probes: [{ token: "OAI-SearchBot", status: 200 }, { token: "PerplexityBot", status: 200 }],
    ...overrides,
  };
}

const status = (report: ReturnType<typeof buildVisibilityReport>, id: string) =>
  report.checks.find((check) => check.id === id)?.status;

describe("AI visibility report", () => {
  it("passes a healthy site and treats training blocks and llms.txt as info", () => {
    const report = buildVisibilityReport(input());
    expect(report.checks.filter((check) => check.status !== "pass" && check.status !== "info")).toEqual([]);
    expect(report.passed).toBe(report.scored);
    expect(status(report, "training-crawlers")).toBe("info");
    expect(status(report, "llms-txt")).toBe("info");
    expect(report.crawlers.find((item) => item.token === "GPTBot")?.allowed).toBe(false);
  });

  it("fails when an AI search crawler is blocked and offers an allow snippet", () => {
    const report = buildVisibilityReport(input({ robots: { status: 200, url: "https://acme.com/robots.txt", body: "User-agent: *\nDisallow: /" } }));
    const check = report.checks.find((item) => item.id === "answer-crawlers");
    expect(check?.status).toBe("fail");
    expect(check?.snippet).toContain("User-agent: OAI-SearchBot");
  });

  it("treats a 5xx robots.txt as a full block and a 404 as no rules", () => {
    expect(status(buildVisibilityReport(input({ robots: { status: 503, url: "https://acme.com/robots.txt" } })), "answer-crawlers")).toBe("fail");
    expect(status(buildVisibilityReport(input({ robots: { status: 404, url: "https://acme.com/robots.txt" } })), "answer-crawlers")).toBe("pass");
  });

  it("flags a firewall that refuses crawler user agents", () => {
    const report = buildVisibilityReport(input({ probes: [{ token: "OAI-SearchBot", status: 403 }] }));
    expect(status(report, "bot-response")).toBe("fail");
  });

  it("flags noindex, nosnippet, JavaScript-only pages and missing basics", () => {
    expect(status(buildVisibilityReport(input({ page: { status: 200, url: "https://acme.com/", body: goodHtml, robotsTag: "noindex" } })), "indexing")).toBe("fail");
    expect(status(buildVisibilityReport(input({ page: { status: 200, url: "https://acme.com/", body: goodHtml.replace("<title>", '<meta name="robots" content="max-snippet:0"><title>') } })), "indexing")).toBe("warn");
    const spa = buildVisibilityReport(input({ page: { status: 200, url: "https://acme.com/", body: '<html><body><div id="root"></div><script>app()</script></body></html>' } }));
    expect(status(spa, "raw-html")).toBe("fail");
    expect(status(spa, "page-basics")).toBe("fail");
    expect(status(spa, "structured-data")).toBe("warn");
  });

  it("warns on a canonical that points to another domain", () => {
    const report = buildVisibilityReport(input({ page: { status: 200, url: "https://acme.com/", body: goodHtml.replace("https://acme.com/", "https://other.com/") } }));
    expect(status(report, "page-basics")).toBe("warn");
  });

  it("recognises a valid llms.txt and ignores HTML served at that path", () => {
    const valid = buildVisibilityReport(input({ llms: { status: 200, url: "https://acme.com/llms.txt", body: "# Acme\n\n> Notes" } }));
    expect(valid.checks.find((check) => check.id === "llms-txt")?.summary).toMatch(/exists and starts/);
    const html = buildVisibilityReport(input({ llms: { status: 200, url: "https://acme.com/llms.txt", body: "<!doctype html><html>", contentType: "text/html" } }));
    expect(html.checks.find((check) => check.id === "llms-txt")?.summary).toMatch(/No llms.txt/);
  });
});

describe("AI visibility report for an unreachable homepage", () => {
  it("leaves page checks out of the count instead of failing them", () => {
    const report = buildVisibilityReport(input({ page: { status: 403, url: "https://acme.com/" } }));
    expect(["bot-response", "indexing", "raw-html", "page-basics", "structured-data"].map((id) => status(report, id))).toEqual(Array(5).fill("info"));
    expect(report.scored).toBe(2);
  });
});
