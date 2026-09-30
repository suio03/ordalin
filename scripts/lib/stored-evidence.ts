import type { CatalogEnrichmentCandidate } from "../../src/lib/catalog-enrichment/contract.ts";

/** D1 rejects any single SQL statement over 100 KB (SQLITE_TOOBIG). */
export const D1_STATEMENT_LIMIT = 100_000;
const UNCITED_EXCERPT = 1_000;

/** Every evidence URL the analysis relies on, including each profile quote. */
function citedUrls(analysis: unknown) {
  const urls = new Set<string>();
  const visit = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value)) {
      if (key === "url" && typeof item === "string") urls.add(item);
      else if (key === "evidence" && item && typeof item === "object" && !Array.isArray(item)) {
        Object.values(item).flat().forEach((url) => typeof url === "string" ? urls.add(url) : visit(url));
      } else visit(item);
    }
  };
  visit(analysis);
  return urls;
}

/**
 * The candidate as stored in D1. Pages the analysis cites keep their full text,
 * because published profiles re-verify every quote against it; uncited pages
 * keep a short excerpt for reviewers so the row stays under the statement limit.
 */
export function storedCandidate(candidate: CatalogEnrichmentCandidate, analysis: unknown): CatalogEnrichmentCandidate {
  const cited = citedUrls(analysis);
  return {
    ...candidate,
    evidencePages: candidate.evidencePages.map((page) => cited.has(page.url) ? page : {
      ...page,
      headings: page.headings.slice(0, 10),
      excerpt: page.excerpt.slice(0, UNCITED_EXCERPT),
    }),
  };
}

export function assertStatementFits(statement: string, label: string) {
  const bytes = new TextEncoder().encode(statement).byteLength;
  if (bytes > D1_STATEMENT_LIMIT) throw new Error(`${label} is ${bytes} bytes; D1 accepts at most ${D1_STATEMENT_LIMIT} per statement.`);
  return statement;
}
