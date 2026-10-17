import type { VisibilityCheck } from "@/lib/free-tools/ai-visibility/checks";

/**
 * Format checks against the llmstxt.org proposal: an H1 name, a blockquote
 * summary, optional detail paragraphs, then H2 sections that list links as
 * `- [name](url): notes`. Pure, so the page can check pasted files in the
 * browser and the API runs the same rules on fetched ones.
 */
export type LlmsLink = { name: string; url: string; notes: string | null; section: string | null; line: number };

export type ParsedLlms = {
  name: string | null;
  summary: string | null;
  sections: Array<{ title: string; line: number; links: LlmsLink[] }>;
  links: LlmsLink[];
  /** List items inside H2 sections that are not `[name](url)` links. */
  malformed: Array<{ line: number; text: string }>;
  h1Lines: number[];
  deepHeadings: Array<{ line: number; text: string }>;
  firstLine: { line: number; text: string } | null;
  summaryLine: number | null;
  /** The first non-empty line after the H1, where the summary belongs. */
  afterH1: string | null;
};

const LINK_ITEM = /^\s*[-*+]\s+\[([^\]]*)\]\(\s*([^)\s]+)\s*\)(?:\s*:\s*(.*?))?\s*$/;
const LIST_ITEM = /^\s*[-*+]\s+\S/;
const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
export const LARGE_FILE_BYTES = 50_000;

const clip = (value: string, length = 100) => (value.length > length ? `${value.slice(0, length - 1)}…` : value);

export function parseLlmsTxt(text: string): ParsedLlms {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  const parsed: ParsedLlms = {
    name: null,
    summary: null,
    sections: [],
    links: [],
    malformed: [],
    h1Lines: [],
    deepHeadings: [],
    firstLine: null,
    summaryLine: null,
    afterH1: null,
  };
  let fenced = false;
  let section: ParsedLlms["sections"][number] | null = null;
  let waitingForSummary = false;

  lines.forEach((raw, index) => {
    const line = index + 1;
    const text = raw.trimEnd();
    if (/^\s*(```|~~~)/.test(text)) {
      fenced = !fenced;
      return;
    }
    if (fenced || !text.trim()) return;
    if (!parsed.firstLine) parsed.firstLine = { line, text };
    if (waitingForSummary) {
      waitingForSummary = false;
      parsed.afterH1 = text;
      if (/^>\s*\S/.test(text)) {
        parsed.summary = text.replace(/^>\s*/, "").trim();
        parsed.summaryLine = line;
      }
    }

    const heading = HEADING.exec(text);
    if (heading) {
      const level = heading[1].length;
      if (level === 1) {
        parsed.h1Lines.push(line);
        if (parsed.name === null) {
          parsed.name = heading[2];
          waitingForSummary = true;
        }
      } else if (level === 2) {
        section = { title: heading[2], line, links: [] };
        parsed.sections.push(section);
      } else {
        parsed.deepHeadings.push({ line, text });
      }
      return;
    }

    const link = LINK_ITEM.exec(text);
    if (link) {
      const entry = { name: link[1].trim(), url: link[2], notes: link[3]?.trim() || null, section: section?.title ?? null, line };
      parsed.links.push(entry);
      section?.links.push(entry);
    } else if (section && LIST_ITEM.test(text)) {
      parsed.malformed.push({ line, text });
    }
  });
  return parsed;
}

const isAbsolute = (url: string) => /^https?:\/\/[^/\s]+/i.test(url);

export function validateLlmsTxt(text: string): VisibilityCheck[] {
  const parsed = parseLlmsTxt(text);
  const checks: VisibilityCheck[] = [];

  // H1
  const h1 = { id: "h1", title: "H1 title" };
  const firstIsH1 = parsed.firstLine !== null && parsed.h1Lines[0] === parsed.firstLine.line;
  if (!parsed.firstLine) {
    checks.push({ ...h1, status: "fail", summary: "The file is empty.", fix: "Start the file with “# Your product name”.", evidence: [] });
  } else if (!firstIsH1) {
    checks.push({
      ...h1,
      status: "fail",
      summary: parsed.h1Lines.length
        ? "The file does not start with its H1. The proposal requires the H1 site or product name first."
        : "The file has no H1. The site or product name as an H1 is the only required part of llms.txt.",
      fix: "Make the first line “# Your product name”, with one space after the #.",
      evidence: [`Line ${parsed.firstLine.line}: “${clip(parsed.firstLine.text)}”`],
    });
  } else if (parsed.h1Lines.length > 1) {
    checks.push({
      ...h1,
      status: "warn",
      summary: `The file has ${parsed.h1Lines.length} H1 headings. Use one H1 for the name and H2 for sections.`,
      fix: "Change the extra “# ” headings to “## ”.",
      evidence: parsed.h1Lines.slice(1, 6).map((line) => `Line ${line}`),
    });
  } else {
    checks.push({ ...h1, status: "pass", summary: `Starts with the H1 “${clip(parsed.name ?? "")}”.`, evidence: [] });
  }

  // Summary
  const summary = { id: "summary", title: "Summary blockquote" };
  if (parsed.summary) {
    checks.push({ ...summary, status: "pass", summary: `Has a summary under the H1: “${clip(parsed.summary, 140)}”.`, evidence: [] });
  } else {
    const elsewhere = text.split(/\r?\n/).findIndex((line) => /^>\s*\S/.test(line));
    checks.push({
      ...summary,
      status: "warn",
      summary: elsewhere >= 0
        ? "There is a blockquote, but not directly under the H1, where the proposal puts the summary."
        : "No summary. The proposal expects a one-line blockquote under the H1 that says what the site is.",
      fix: "Add a line such as “> Acme turns meetings into searchable notes for product teams.” directly under the H1.",
      evidence: elsewhere >= 0 ? [`Line ${elsewhere + 1}`] : parsed.afterH1 ? [`Line after the H1: “${clip(parsed.afterH1)}”`] : [],
    });
  }

  // Sections
  const sections = { id: "sections", title: "H2 sections" };
  const empty = parsed.sections.filter((entry) => !entry.links.length);
  const deep = parsed.deepHeadings.map((entry) => `Line ${entry.line}: “${clip(entry.text)}”`);
  if (!parsed.sections.length) {
    checks.push({
      ...sections,
      status: "warn",
      summary: parsed.links.length
        ? "Links are not under any H2 section. Tools that read llms.txt look for links inside “## ” sections."
        : "No H2 sections with links. Without them the file is only a name and a summary.",
      fix: "Group links under headings such as “## Docs” and “## Product”.",
      evidence: deep,
    });
  } else {
    // Text-only sections and H3 groups do not break the file: the reference
    // parser keeps H3 content in its H2 section and skips items without links.
    const notes = [
      empty.length ? `${empty.length} hold text but no links; tools that read llms.txt use the links and may skip the text.` : "",
      deep.length ? "H3 headings are grouped into the H2 above them; the llmstxt.org reference parser splits sections on H2 only." : "",
    ].filter(Boolean);
    checks.push({
      ...sections,
      status: "pass",
      summary: `${parsed.sections.length} H2 section${parsed.sections.length === 1 ? "" : "s"}: ${clip(parsed.sections.map((entry) => entry.title).join(", "), 160)}.${notes.length ? ` ${notes.join(" ")}` : ""}`.replace("….", "…"),
      evidence: [...empty.map((entry) => `Line ${entry.line}: “## ${clip(entry.title)}” has no links`), ...deep].slice(0, 12),
    });
  }

  // Links
  const links = { id: "links", title: "Link format" };
  const relative = parsed.links.filter((link) => !isAbsolute(link.url));
  const seen = new Map<string, number>();
  const duplicates: LlmsLink[] = [];
  for (const link of parsed.links) {
    const key = link.url.replace(/#.*$/, "").replace(/\/$/, "");
    if (seen.has(key)) duplicates.push(link);
    else seen.set(key, link.line);
  }
  const unnamed = parsed.links.filter((link) => !link.name);
  if (!parsed.links.length) {
    checks.push({ ...links, status: "warn", summary: "No links found.", fix: "Add lines such as “- [Pricing](https://acme.com/pricing): Plans and limits” under an H2.", evidence: parsed.malformed.slice(0, 8).map((item) => `Line ${item.line}: “${clip(item.text)}”`) });
  } else if (relative.length || duplicates.length || unnamed.length) {
    const problems = [
      relative.length ? `${relative.length} link${relative.length === 1 ? " is" : "s are"} not a full URL` : "",
      duplicates.length ? `${duplicates.length} link${duplicates.length === 1 ? " is" : "s are"} listed twice` : "",
      unnamed.length ? `${unnamed.length} link${unnamed.length === 1 ? " has" : "s have"} no name` : "",
      parsed.malformed.length ? `${parsed.malformed.length} list item${parsed.malformed.length === 1 ? " is" : "s are"} plain text` : "",
    ].filter(Boolean);
    checks.push({
      ...links,
      status: "warn",
      summary: `${parsed.links.length} link${parsed.links.length === 1 ? "" : "s"}; ${problems.join(", ")}.`,
      fix: "Write each entry as “- [Page name](https://full-url): optional notes”, once per page.",
      evidence: [
        ...relative.map((link) => `Line ${link.line}: ${clip(link.url)} is relative`),
        ...duplicates.map((link) => `Line ${link.line}: ${clip(link.url)} also on line ${seen.get(link.url.replace(/#.*$/, "").replace(/\/$/, ""))}`),
        ...unnamed.map((link) => `Line ${link.line}: ${clip(link.url)} has empty link text`),
        ...parsed.malformed.map((item) => `Line ${item.line}: “${clip(item.text)}” is not a link`),
      ].slice(0, 15),
    });
  } else {
    const described = parsed.links.filter((link) => link.notes).length;
    checks.push({
      ...links,
      status: "pass",
      summary: `${parsed.links.length} link${parsed.links.length === 1 ? "" : "s"}, all full URLs in the “[name](url)” format; ${described} with notes.${
        parsed.malformed.length ? ` ${parsed.malformed.length} other list item${parsed.malformed.length === 1 ? " is" : "s are"} plain text, which tools that read llms.txt skip.` : ""
      }`,
      evidence: parsed.malformed.slice(0, 8).map((item) => `Line ${item.line}: “${clip(item.text)}”`),
    });
  }

  // Optional section
  const optional = parsed.sections.some((entry) => entry.title.trim().toLowerCase() === "optional");
  checks.push({
    id: "optional",
    title: "Optional section",
    status: "info",
    summary: optional
      ? "Has an “## Optional” section for links that tools can skip when they need a shorter context."
      : "No “## Optional” section. It is not required; use it for links that tools can skip, such as legal pages.",
    evidence: [],
  });

  const bytes = new TextEncoder().encode(text).byteLength;
  if (bytes > LARGE_FILE_BYTES) {
    checks.push({
      id: "size",
      title: "File size",
      status: "warn",
      summary: `The file is ${Math.round(bytes / 1000)} KB. llms.txt is meant to be a short index; long files use up the context of the tool that reads them.`,
      fix: "Keep llms.txt to the key pages and link to longer markdown files instead of pasting their text.",
      evidence: [],
    });
  }
  return checks;
}
