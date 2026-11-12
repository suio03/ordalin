// Landing copy for the image-shape tool pages. One object per page and locale;
// the English object defines the shape, so a missing key fails `tsc`.
// Inline markup in strings: **bold** and [anchor](/path). Nothing else.

export type Block =
  | { p: string }
  | { ol: string[] }
  | { ul: string[] }
  | { table: { head: string[]; rows: string[][] } };

export type PageSection = { id: string; h2: string; blocks: Block[] };

export type ToolPageCopy = {
  title: string;
  description: string;
  h1: string;
  subtitle: string;
  sections: PageSection[];
  faqHeading: string;
  faq: { q: string; a: string }[];
  closing: string;
};

/** Markup-free text for meta tags and JSON-LD. */
export function plain(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[(.+?)\]\((.+?)\)/g, "$1");
}
