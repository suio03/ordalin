import { editorialPages } from "@/content/editorial";
import {
  editorialToolSlugs,
  type EditorialKind,
  type EditorialPage,
} from "./types";

export * from "./types";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
export const minimumPicks = 3;

/** Drafts render locally for review; production only serves published pages. */
export function editorialPreviewEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.ORDALIN_EDITORIAL_PREVIEW === "1";
}

export function validateEditorialPage(page: EditorialPage): string[] {
  const errors: string[] = [];
  const where = `${page.kind}/${page.slug}`;
  if (!slugPattern.test(page.slug)) errors.push(`${where}: slug is invalid.`);
  if (page.title.trim().length < 10) errors.push(`${where}: title is too short.`);
  if (page.description.length < 70 || page.description.length > 170) {
    errors.push(`${where}: description must be 70–170 characters.`);
  }
  if (!page.author.trim()) errors.push(`${where}: author is required.`);
  if (page.disclosure !== undefined && page.disclosure.trim().length < 20) {
    errors.push(`${where}: disclosure must say what the relationship is.`);
  }
  for (const [field, value] of [["publishedAt", page.publishedAt], ["updatedAt", page.updatedAt]] as const) {
    if (value !== undefined && (!datePattern.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`)))) {
      errors.push(`${where}: ${field} must use YYYY-MM-DD.`);
    }
  }
  if (page.updatedAt && page.updatedAt < page.publishedAt) errors.push(`${where}: updatedAt precedes publishedAt.`);
  if (!page.intro.length) errors.push(`${where}: intro is required.`);
  if (page.faq.length < 3) errors.push(`${where}: at least three FAQ entries are required.`);

  const slugs = editorialToolSlugs(page);
  if (new Set(slugs).size !== slugs.length) errors.push(`${where}: a tool appears more than once.`);

  if (page.kind === "compare") {
    const [left, right] = page.sides;
    if (page.slug !== `${left.toolSlug}-vs-${right.toolSlug}`) {
      errors.push(`${where}: slug must be "<left>-vs-<right>".`);
    }
    if (page.sides.some((side) => side.chooseIf.length < 2)) errors.push(`${where}: each side needs two or more reasons.`);
    if (page.differences.length < 4) errors.push(`${where}: at least four differences are required.`);
  } else {
    if (page.picks.length < minimumPicks) errors.push(`${where}: at least ${minimumPicks} picks are required.`);
    const pickSlugs = new Set(page.picks.map((pick) => pick.toolSlug));
    for (const row of page.decisionGuide) {
      if (!pickSlugs.has(row.toolSlug)) errors.push(`${where}: decision guide names ${row.toolSlug}, which is not a pick.`);
    }
    if (page.kind === "alternatives" && pickSlugs.has(page.anchorSlug)) {
      errors.push(`${where}: the anchor tool cannot also be a pick.`);
    }
  }
  return errors;
}

function visible(page: EditorialPage) {
  return page.status === "published" || editorialPreviewEnabled();
}

function byRecency(left: EditorialPage, right: EditorialPage) {
  return (right.updatedAt ?? right.publishedAt).localeCompare(left.updatedAt ?? left.publishedAt);
}

export function listEditorialPages(kind?: EditorialKind): EditorialPage[] {
  return editorialPages
    .filter((page) => (!kind || page.kind === kind) && visible(page))
    .sort(byRecency);
}

export function getEditorialPage<K extends EditorialKind>(kind: K, slug: string) {
  const page = editorialPages.find((item) => item.kind === kind && item.slug === slug);
  return page && visible(page) ? (page as Extract<EditorialPage, { kind: K }>) : null;
}

/**
 * A page is live only when enough of the tools it names are published; a
 * catalogue removal therefore withdraws the article instead of leaving gaps.
 */
export function editorialIsComplete(page: EditorialPage, publishedSlugs: ReadonlySet<string>) {
  if (page.kind === "compare") return page.sides.every((side) => publishedSlugs.has(side.toolSlug));
  if (page.kind === "alternatives" && !publishedSlugs.has(page.anchorSlug)) return false;
  return page.picks.filter((pick) => publishedSlugs.has(pick.toolSlug)).length >= minimumPicks;
}

export function missingEditorialTools(page: EditorialPage, publishedSlugs: ReadonlySet<string>) {
  return editorialToolSlugs(page).filter((slug) => !publishedSlugs.has(slug));
}

/** Editorial pages that name a tool, excluding one page when given. */
export function listEditorialPagesForTool(toolSlug: string, exclude?: EditorialPage) {
  return listEditorialPages().filter(
    (page) => page !== exclude && editorialToolSlugs(page).includes(toolSlug),
  );
}

export function listRelatedEditorial(page: EditorialPage, limit = 6) {
  const slugs = new Set(editorialToolSlugs(page));
  return listEditorialPages()
    .filter((other) => other !== page)
    .map((other) => ({
      other,
      score: editorialToolSlugs(other).filter((slug) => slugs.has(slug)).length * 2
        + (other.groupSlug === page.groupSlug ? 1 : 0),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || byRecency(left.other, right.other))
    .slice(0, limit)
    .map((item) => item.other);
}

export function formatEditorialDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}
