import type { CatalogEnrichmentCandidate } from "../catalog-enrichment/contract";
import type {
  CatalogAnalysis,
  CatalogAnalysisDecision,
  CatalogTaxonomy,
} from "./contract.ts";
import { prohibitedContentReasons } from "./content-policy.ts";

function normalizedUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

export function decideCatalogAnalysis(
  candidate: CatalogEnrichmentCandidate,
  analysis: CatalogAnalysis,
  taxonomy: CatalogTaxonomy,
): CatalogAnalysisDecision {
  const homepage = candidate.evidencePages.find((page) => page.role === "homepage");
  const prohibited = prohibitedContentReasons([analysis.name, analysis.tagline, analysis.description, homepage?.title ?? "", homepage?.description ?? ""]);
  if (prohibited.length) return { outcome: "skip", reasons: prohibited };
  if (!analysis.isAiTool) {
    return { outcome: "skip", reasons: ["The official website does not establish this as an AI-enabled product."] };
  }

  const reasons = [...analysis.needsReviewReasons];
  const categories = new Map(taxonomy.categories.map((category) => [category.slug, category]));
  const tags = new Map(taxonomy.tags.map((tag) => [tag.slug, tag]));
  const allowedEvidence = new Set(
    [candidate.websiteUrl, ...candidate.evidencePages.map((page) => page.url)]
      .map(normalizedUrl)
      .filter((value): value is string => Boolean(value)),
  );
  const evidenceGroups = Object.entries(analysis.evidence) as Array<[string, string[]]>;

  if (analysis.name.length < 2) reasons.push("Product name is missing or too short.");
  if (analysis.tagline.length < 20) reasons.push("Short description is incomplete.");
  if (analysis.description.length < 60) reasons.push("Detailed description is incomplete.");
  if (analysis.pricingModel === "unknown") reasons.push("Pricing could not be verified.");
  if (!categories.has(analysis.primaryCategorySlug) || analysis.primaryCategorySlug === "other") {
    reasons.push("Primary category is unavailable or unresolved.");
  }
  if (!analysis.categorySlugs.includes(analysis.primaryCategorySlug)) {
    reasons.push("Primary category is not included in the selected category groups.");
  }
  if (analysis.categorySlugs.some((slug) => !categories.has(slug) || slug === "other")) {
    reasons.push("One or more category groups are unavailable.");
  }

  const selectedTags = analysis.tagSlugs.map((slug) => tags.get(slug));
  if (selectedTags.some((tag) => !tag)) reasons.push("One or more tags are unavailable.");
  const browseTags = selectedTags.filter((tag) => tag?.kind === "category");
  if (!browseTags.length) reasons.push("A concrete category is required.");
  if (!browseTags.some((tag) => tag?.groupSlug === analysis.primaryCategorySlug)) {
    reasons.push("A concrete category from the primary group is required.");
  }

  for (const [field, urls] of evidenceGroups) {
    if (!urls.length) reasons.push(`${field} has no official-page evidence.`);
    if (urls.some((url) => !allowedEvidence.has(normalizedUrl(url) ?? ""))) {
      reasons.push(`${field} cites a page that was not fetched from the official website.`);
    }
  }
  if (candidate.warnings.length) reasons.push(...candidate.warnings.map((warning) => `Crawler warning: ${warning}`));

  return {
    outcome: reasons.length ? "skip" : "auto_publish",
    reasons: [...new Set(reasons)],
  };
}
