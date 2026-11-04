import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import source from "@/content/mcp/mcp.json";
import { REGISTRY } from "@/content/mcp";
import { allMcpPaths, allServers } from "./data";

const CONTENT = join(process.cwd(), "src", "content", "mcp");
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isUrl = (value: unknown) => typeof value === "string" && /^https?:\/\//.test(value) && URL.canParse(value);

const KEYS = new Set([
  "slug", "name", "maintainer", "kind", "repo", "license", "version", "transport", "install", "requires", "clients", "does", "checked_on",
]);
const REQUIRED = ["name", "maintainer", "license", "version", "transport", "install", "requires", "clients", "does"];

function problems(server: Record<string, unknown>): string[] {
  const out: string[] = [];
  Object.keys(server).filter((k) => !KEYS.has(k)).forEach((k) => out.push(`unexpected field ${k}`));
  for (const key of REQUIRED) if (typeof server[key] !== "string" || !server[key]) out.push(`${key} missing (use "unknown")`);
  if (server.kind !== "official" && server.kind !== "community") out.push("kind must be official or community");
  if (!/^[a-z0-9-]+$/.test(String(server.slug))) out.push("slug must be kebab-case");
  if (!isUrl(server.repo)) out.push("repo must be a URL");
  if (!DATE.test(String(server.checked_on))) out.push("checked_on must be YYYY-MM-DD");
  return out;
}

const mdxFiles = () => readdirSync(CONTENT, { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".mdx"));

describe("MCP server facts (mcp.json)", () => {
  it("validates every server", () => {
    const found = Object.fromEntries(
      (source.servers as Record<string, unknown>[]).map((s) => [String(s.slug), problems(s)] as const).filter(([, found]) => found.length),
    );
    expect(found).toEqual({});
  });

  it("has unique slugs", () => {
    const slugs = allServers().map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("MCP page registry (index.ts)", () => {
  it("registers exactly the MDX files in servers/", () => {
    const files = readdirSync(join(CONTENT, "servers")).filter((f) => f.endsWith(".mdx")).map((f) => f.slice(0, -4));
    expect(Object.keys(REGISTRY.servers).sort()).toEqual(files.sort());
  });

  it("has facts for every page", () => {
    const known = new Set(allServers().map((s) => s.slug));
    expect(Object.keys(REGISTRY.servers).filter((slug) => !known.has(slug))).toEqual([]);
  });

  // Vitest does not compile MDX, so the test record is checked as text.
  it.each(Object.keys(REGISTRY.servers).map((slug) => [slug]))("records a real connection test on %s", (slug) => {
    const text = readFileSync(join(CONTENT, "servers", `${slug}.mdx`), "utf8");
    expect(text).toMatch(/\btest: \{[\s\S]*date: "\d{4}-\d{2}-\d{2}"/);
    expect(text).toMatch(/\bmodel: "[^"]+"/);
    expect(text).toMatch(/\blisted: \[\s*"/);
    expect(text).toMatch(/\bpermissions: \[\s*"/);
    expect(text.match(/\blabel: "/g)?.length ?? 0).toBeGreaterThanOrEqual(1);
  });

  it("puts only published pages in the sitemap", () => {
    const drafts = Object.entries(REGISTRY.servers).filter(([, e]) => e.status !== "published").map(([slug]) => `/mcp/${slug}`);
    expect(allMcpPaths().filter((path) => drafts.includes(path))).toEqual([]);
  });

  it("keeps pages and facts in English", () => {
    const cjk = /[　-鿿＀-￯]/;
    const files = readdirSync(CONTENT, { recursive: true, encoding: "utf8" }).filter((f) => /\.(mdx|json)$/.test(f));
    expect(files.filter((file) => cjk.test(readFileSync(join(CONTENT, file), "utf8")))).toEqual([]);
  });

  it("links only to /mcp pages that exist", () => {
    const known = new Set(["/mcp", ...Object.keys(REGISTRY.servers).map((slug) => `/mcp/${slug}`)]);
    const broken = mdxFiles().flatMap((file) => {
      const text = readFileSync(join(CONTENT, file), "utf8");
      const links = [...text.matchAll(/\]\((\/[^)\s]*)\)|href(?:="|: ")(\/[^"]*)"/g)].map((m) => (m[1] ?? m[2]).split("#")[0]);
      return links.filter((link) => link === "/mcp" || link.startsWith("/mcp/")).filter((link) => !known.has(link)).map((link) => `${file}: ${link}`);
    });
    expect(broken).toEqual([]);
  });
});
