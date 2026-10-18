import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import source from "@/content/skills/skills.json";
import { REGISTRY } from "@/content/skills";
import { allSkills, allSkillsPaths, NOT_STATED, stated } from "./data";

const CONTENT = join(process.cwd(), "src", "content", "skills");
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isUrl = (value: unknown) => typeof value === "string" && /^https?:\/\//.test(value) && URL.canParse(value);

const SKILL_KEYS = new Set([
  "slug", "name", "display_name", "author", "repo", "license", "version", "agents", "install", "language", "produces", "checked_on",
]);
const REQUIRED = ["name", "author", "license", "version", "agents", "install", "language", "produces"];

/** Facts that break the page template, or that do not belong in the public repository. */
function problems(skill: Record<string, unknown>): string[] {
  const out: string[] = [];
  Object.keys(skill).filter((k) => !SKILL_KEYS.has(k)).forEach((k) => out.push(`unexpected field ${k}`));
  for (const key of REQUIRED) if (typeof skill[key] !== "string" || !skill[key]) out.push(`${key} missing (use "unknown")`);
  if (!/^[a-z0-9-]+$/.test(String(skill.slug))) out.push("slug must be kebab-case");
  if (!isUrl(skill.repo)) out.push("repo must be a URL");
  if (!DATE.test(String(skill.checked_on))) out.push("checked_on must be YYYY-MM-DD");
  return out;
}

describe("skill facts (skills.json)", () => {
  it("validates every skill", () => {
    const found = Object.fromEntries(
      (source.skills as Record<string, unknown>[]).map((skill) => [String(skill.slug), problems(skill)] as const).filter(([, found]) => found.length),
    );
    expect(found).toEqual({});
  });

  it("has unique slugs", () => {
    const slugs = allSkills().map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("renders unknown values as Not stated", () => {
    expect(stated("unknown")).toBe(NOT_STATED);
    expect(stated(undefined)).toBe(NOT_STATED);
  });
});

describe("skill page registry (index.ts)", () => {
  it("registers exactly the MDX files in skills/", () => {
    const files = readdirSync(join(CONTENT, "skills")).filter((f) => f.endsWith(".mdx")).map((f) => f.slice(0, -4));
    expect(Object.keys(REGISTRY.skills).sort()).toEqual(files.sort());
  });

  it("has facts for every page", () => {
    const known = new Set(allSkills().map((s) => s.slug));
    expect(Object.keys(REGISTRY.skills).filter((slug) => !known.has(slug))).toEqual([]);
  });

  // Vitest does not compile MDX, so the test record is checked as text.
  it.each(Object.keys(REGISTRY.skills))("records a real test run on %s", (slug) => {
    const text = readFileSync(join(CONTENT, "skills", `${slug}.mdx`), "utf8");
    expect(text).toMatch(/\btest: \{[\s\S]*date: "\d{4}-\d{2}-\d{2}"/);
    expect(text).toMatch(/\bmodel: "[^"]+"/);
    expect(text).toMatch(/\bcommit: "[0-9a-f]{7,40}"/);
    expect(text.match(/\blabel: "/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it("puts only published pages in the sitemap", () => {
    const drafts = Object.entries(REGISTRY.skills).filter(([, e]) => e.status !== "published").map(([slug]) => `/skills/${slug}`);
    expect(allSkillsPaths().filter((path) => drafts.includes(path))).toEqual([]);
  });

  it("keeps pages and facts in English", () => {
    const cjk = /[　-鿿＀-￯]/;
    const files = readdirSync(CONTENT, { recursive: true, encoding: "utf8" }).filter((f) => /\.(mdx|json)$/.test(f));
    expect(files.filter((file) => cjk.test(readFileSync(join(CONTENT, file), "utf8")))).toEqual([]);
  });

  it("links only to /skills pages that exist", () => {
    const known = new Set(["/skills", ...Object.keys(REGISTRY.skills).map((slug) => `/skills/${slug}`)]);
    const mdx = readdirSync(CONTENT, { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".mdx"));
    const broken = mdx.flatMap((file) => {
      const text = readFileSync(join(CONTENT, file), "utf8");
      const links = [...text.matchAll(/\]\((\/[^)\s]*)\)|href(?:="|: ")(\/[^"]*)"/g)].map((m) => (m[1] ?? m[2]).split("#")[0]);
      return links.filter((link) => link.startsWith("/skills") && !known.has(link)).map((link) => `${file}: ${link}`);
    });
    expect(broken).toEqual([]);
  });
});
