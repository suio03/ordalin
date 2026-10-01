// Editorial pages hold judgement (who a tool suits, what to watch for). Facts such
// as pricing, platforms and check dates are read live from the tool's researched
// profile so an article cannot drift from the catalogue.

export const editorialKinds = ["best", "alternatives", "compare"] as const;
export type EditorialKind = (typeof editorialKinds)[number];
export type EditorialStatus = "draft" | "published";

export type EditorialFaq = { question: string; answer: string };

export type EditorialPick = {
  toolSlug: string;
  /** Short award-style label, e.g. "Best for Gmail power users". */
  label: string;
  /** Who should choose it, in the reader's own situation. */
  bestFor: string;
  /** Who should look elsewhere. */
  notIdealIf: string;
  /** What separates it from the other picks; one or two short paragraphs. */
  summary: string[];
};

export type DecisionRow = { situation: string; toolSlug: string };

type EditorialBase = {
  slug: string;
  title: string;
  /** Meta description and card summary, 70–170 characters. */
  description: string;
  author: string;
  /** Plain statement of any ownership or commercial tie to a named tool, shown under the byline. */
  disclosure?: string;
  publishedAt: string;
  updatedAt?: string;
  status: EditorialStatus;
  /** Top-level category group used for homepage shelves and related links. */
  groupSlug: string;
  intro: string[];
  faq: EditorialFaq[];
};

export type BestPage = EditorialBase & {
  kind: "best";
  criteria: Array<{ title: string; text: string }>;
  picks: EditorialPick[];
  decisionGuide: DecisionRow[];
  closing: string[];
};

export type AlternativesPage = EditorialBase & {
  kind: "alternatives";
  /** The well-known tool the reader wants to replace. */
  anchorSlug: string;
  whySwitch: string[];
  picks: EditorialPick[];
  decisionGuide: DecisionRow[];
};

export type ComparisonSide = { toolSlug: string; chooseIf: string[] };

export type ComparePage = EditorialBase & {
  kind: "compare";
  verdict: string;
  sides: [ComparisonSide, ComparisonSide];
  differences: Array<{ topic: string; left: string; right: string }>;
};

export type EditorialPage = BestPage | AlternativesPage | ComparePage;

export const editorialPaths: Record<EditorialKind, string> = {
  best: "/best",
  alternatives: "/alternatives",
  compare: "/compare",
};

export const editorialKindLabels: Record<EditorialKind, string> = {
  best: "Best of",
  alternatives: "Alternatives",
  compare: "Comparison",
};

export function editorialHref(page: Pick<EditorialPage, "kind" | "slug">) {
  return `${editorialPaths[page.kind]}/${page.slug}`;
}

export function editorialToolSlugs(page: EditorialPage): string[] {
  if (page.kind === "compare") return page.sides.map((side) => side.toolSlug);
  const slugs = page.picks.map((pick) => pick.toolSlug);
  return page.kind === "alternatives" ? [page.anchorSlug, ...slugs] : slugs;
}
