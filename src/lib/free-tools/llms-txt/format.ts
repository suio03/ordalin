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

/** Quick format hints for the edited file; not a full validator. */
export function formatHints(text: string): FormatHint[] {
  const lines = text.split(/\r?\n/);
  const first = lines.find((line) => line.trim()) ?? "";
  const links = [...text.matchAll(/^\s*-\s*\[[^\]]*\]\(([^)\s]+)\)/gm)].map((match) => match[1]);
  const relative = links.filter((url) => !/^https?:\/\//i.test(url));
  return [
    { ok: /^# \S/.test(first), text: /^# \S/.test(first) ? "Starts with an H1 site name" : "The first line must be an H1, such as “# Your product”" },
    { ok: lines.some((line) => /^> \S/.test(line)), text: lines.some((line) => /^> \S/.test(line)) ? "Has a one-line summary" : "Add a “> ” summary line under the H1" },
    {
      ok: links.length > 0 && relative.length === 0,
      text: !links.length
        ? "No links yet. Add “- [Page name](https://…)” lines under an H2"
        : relative.length
          ? `${relative.length} link${relative.length === 1 ? " is" : "s are"} not a full URL`
          : `${links.length} link${links.length === 1 ? "" : "s"}, all full URLs`,
    },
  ];
}
