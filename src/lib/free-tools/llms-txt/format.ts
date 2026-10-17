import { validateLlmsTxt } from "./validate";

/**
 * The llms.txt format from llmstxt.org: an H1 with the site name, an optional
 * blockquote summary, then H2 sections that each hold a list of
 * `- [name](url): notes` links. "Optional" holds links an agent may skip.
 *
 * This module has no server dependencies so the page can rebuild the file in
 * the browser while the visitor edits the page list.
 */
export const sectionOrder = ["Docs", "Product", "Use cases", "Pages", "Blog", "Company", "Optional"] as const;
export type Section = (typeof sectionOrder)[number];

export type LlmsPage = {
  url: string;
  title: string;
  description: string | null;
  section: Section;
};

export type ExcludedPage = { url: string; reason: string };

export type LlmsDraft = {
  website: string;
  domain: string;
  name: string;
  summary: string | null;
  pages: LlmsPage[];
  excluded: ExcludedPage[];
  /** Pages found beyond the listing limit, reported as a count only. */
  omitted: number;
  source: "sitemap" | "homepage-links";
  generatedAt: string;
};

const oneLine = (value: string) => value.replace(/\s+/g, " ").trim();
// Brackets would end the link text early; parentheses inside a URL are percent-encoded.
const linkText = (value: string) => oneLine(value).replace(/[[\]]/g, "");
const linkUrl = (value: string) =>
  value.replace(/[()\s]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);

export function renderLlmsTxt(draft: Pick<LlmsDraft, "name" | "summary" | "pages">) {
  const lines = [`# ${oneLine(draft.name)}`];
  if (draft.summary) lines.push("", `> ${oneLine(draft.summary)}`);
  for (const section of sectionOrder) {
    const pages = draft.pages.filter((page) => page.section === section);
    if (!pages.length) continue;
    lines.push("", `## ${section}`, "");
    for (const page of pages) {
      const notes = page.description ? `: ${oneLine(page.description)}` : "";
      lines.push(`- [${linkText(page.title)}](${linkUrl(page.url)})${notes}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

export type FormatHint = { ok: boolean; text: string };

/** Quick hints for the edited file, from the same rules as the llms.txt checker. */
export function formatHints(text: string): FormatHint[] {
  return validateLlmsTxt(text)
    .filter((check) => ["h1", "summary", "links"].includes(check.id))
    .map((check) => ({ ok: check.status === "pass", text: check.summary }));
}
