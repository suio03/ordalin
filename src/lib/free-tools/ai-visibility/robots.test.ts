import { parseRobots, robotsVerdict } from "./robots";

const verdict = (text: string, token: string, path = "/") => robotsVerdict(parseRobots(text), token, path);

describe("robots.txt matching", () => {
  it("allows everything without rules", () => {
    expect(verdict("", "GPTBot")).toEqual({ allowed: true, group: "none", rule: null });
  });

  it("uses the crawler's own group before the wildcard group", () => {
    const text = "User-agent: *\nDisallow: /\n\nUser-agent: OAI-SearchBot\nAllow: /";
    expect(verdict(text, "oai-searchbot")).toMatchObject({ allowed: true, group: "specific" });
    expect(verdict(text, "PerplexityBot")).toMatchObject({ allowed: false, group: "wildcard", rule: "Disallow: /" });
  });

  it("shares rules across consecutive user-agent lines and merges repeated groups", () => {
    const text = "User-agent: GPTBot\nUser-agent: ClaudeBot\nDisallow: /\n\nUser-agent: ClaudeBot\nAllow: /$";
    expect(verdict(text, "GPTBot").allowed).toBe(false);
    expect(verdict(text, "ClaudeBot")).toMatchObject({ allowed: true, rule: "Allow: /$" });
  });

  it("lets the longest rule win and allow win a tie", () => {
    const text = "User-agent: *\nDisallow: /\nAllow: /docs\nDisallow: /docs/private\nAllow: /x\nDisallow: /x";
    expect(verdict(text, "Bingbot", "/docs/intro").allowed).toBe(true);
    expect(verdict(text, "Bingbot", "/docs/private/a").allowed).toBe(false);
    expect(verdict(text, "Bingbot", "/x").allowed).toBe(true);
  });

  it("supports * and $ in patterns", () => {
    const text = "User-agent: *\nDisallow: /*.pdf$\nDisallow: /search*q=";
    expect(verdict(text, "Googlebot", "/a/b.pdf").allowed).toBe(false);
    expect(verdict(text, "Googlebot", "/a/b.pdf?x").allowed).toBe(true);
    expect(verdict(text, "Googlebot", "/search?page=2&q=ai").allowed).toBe(false);
  });

  it("ignores empty disallow lines, comments and collects sitemaps", () => {
    const parsed = parseRobots("# hi\nUser-agent: *\nDisallow:\nSitemap: https://example.com/sitemap.xml # main");
    expect(robotsVerdict(parsed, "CCBot")).toEqual({ allowed: true, group: "wildcard", rule: null });
    expect(parsed.sitemaps).toEqual(["https://example.com/sitemap.xml"]);
  });
});
