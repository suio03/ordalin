import type { CatalogEnrichmentCandidate } from "@/lib/catalog-enrichment/contract";
import type { CatalogAnalysis, CatalogTaxonomy } from "./contract";

export function fallbackCatalogAnalysis(
  candidate: CatalogEnrichmentCandidate,
  taxonomy: CatalogTaxonomy,
): CatalogAnalysis {
  const fallbackCategory = taxonomy.categories.find((category) => category.slug !== "other")?.slug ?? "other";
  const inferredTags = new Set<string>();
  if (candidate.platforms.some((platform) => ["macOS", "Windows", "Linux"].includes(platform.value))) inferredTags.add("desktop-app");
  if (candidate.platforms.some((platform) => platform.value === "Web app")) inferredTags.add("web-app");
  if (candidate.platforms.some((platform) => platform.value === "Browser extension")) inferredTags.add("browser-extension");
  if (["free", "freemium"].includes(candidate.pricingSignals[0]?.value ?? "")) inferredTags.add("free-plan");
  const tagSlugs = taxonomy.tags.filter((tag) => inferredTags.has(tag.slug)).map((tag) => tag.slug);

  return {
    schemaVersion: 1,
    isAiTool: true,
    name: candidate.identity.name?.value ?? "",
    tagline: candidate.identity.tagline?.value ?? "",
    description: candidate.identity.tagline?.value ?? "",
    pricingModel: candidate.pricingSignals[0]?.value ?? "unknown",
    primaryCategorySlug: fallbackCategory,
    categorySlugs: [fallbackCategory],
    tagSlugs,
    evidence: {
      identity: candidate.identity.name ? [candidate.identity.name.sourceUrl] : [],
      description: candidate.identity.tagline ? [candidate.identity.tagline.sourceUrl] : [],
      pricing: candidate.pricingSignals[0] ? [candidate.pricingSignals[0].sourceUrl] : [],
      classification: [],
    },
    needsReviewReasons: ["OpenAI analysis is not configured; review every generated field."],
  };
}
