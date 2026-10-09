import type { CatalogEnrichmentCandidate } from "@/lib/catalog-enrichment/contract";
import type { CatalogAnalysis, CatalogTaxonomy } from "./contract";
import { decideCatalogAnalysis } from "./gate";

const taxonomy: CatalogTaxonomy = {
  categories: [{ slug: "coding", name: "Coding & Development", description: "Build software." }],
  tags: [{ slug: "coding-assistant", name: "Coding assistant", kind: "category", groupSlug: "coding", description: "Write code." }],
};

const candidate: CatalogEnrichmentCandidate = {
  schemaVersion: 1,
  status: "pending_review",
  websiteUrl: "https://example.com/",
  canonicalDomain: "example.com",
  fetchedAt: "2026-08-25T00:00:00.000Z",
  identity: null as never,
  assets: [], pricingSignals: [], platforms: [], officialLinks: [], warnings: [],
  evidencePages: [
    { url: "https://example.com/", role: "homepage", title: null, description: null, headings: [], excerpt: "Evidence" },
    { url: "https://example.com/pricing", role: "pricing", title: null, description: null, headings: [], excerpt: "Paid plan" },
  ],
};

const analysis: CatalogAnalysis = {
  schemaVersion: 1,
  isAiTool: true,
  name: "Example AI",
  tagline: "Review code with evidence before every software release.",
  description: "Example AI reviews software changes and returns evidence-linked findings for development teams before release.",
  pricingModel: "paid",
  primaryCategorySlug: "coding",
  categorySlugs: ["coding"],
  tagSlugs: ["coding-assistant"],
  evidence: {
    identity: ["https://example.com/"],
    description: ["https://example.com/"],
    pricing: ["https://example.com/pricing"],
    classification: ["https://example.com/"],
  },
  needsReviewReasons: [],
};

describe("catalogue automatic publication gate", () => {
  it("allows only complete evidence-backed records", () => {
    expect(decideCatalogAnalysis(candidate, analysis, taxonomy)).toEqual({ outcome: "auto_publish", reasons: [] });
  });

  it("permanently skips crawler warnings and unknown prices", () => {
    const result = decideCatalogAnalysis(
      { ...candidate, warnings: ["pricing: HTTP 403"] },
      { ...analysis, pricingModel: "unknown" },
      taxonomy,
    );
    expect(result.outcome).toBe("skip");
    expect(result.reasons).toEqual(expect.arrayContaining([
      "Pricing could not be verified.",
      "Crawler warning: pricing: HTTP 403",
    ]));
  });

  it("skips products the evidence does not establish as AI tools", () => {
    expect(decideCatalogAnalysis(candidate, { ...analysis, isAiTool: false }, taxonomy).outcome).toBe("skip");
  });

  it("skips adult and gambling products before any other check", () => {
    expect(decideCatalogAnalysis(candidate, { ...analysis, tagline: "Uncensored NSFW AI girlfriend chat with photos." }, taxonomy)).toEqual({
      outcome: "skip",
      reasons: ['Prohibited content: adult ("NSFW").'],
    });
    expect(decideCatalogAnalysis(candidate, { ...analysis, description: "AI betting tips and sportsbook odds for every match." }, taxonomy).reasons)
      .toEqual(['Prohibited content: gambling ("betting tips").']);
  });

  it("skips domains Cloudflare classifies as adult, gambling or a security threat", () => {
    expect(decideCatalogAnalysis(candidate, analysis, taxonomy, [{ id: 26, name: "Technology" }]).outcome).toBe("auto_publish");
    expect(decideCatalogAnalysis(candidate, analysis, taxonomy, [{ id: 99, name: "Gambling" }]).reasons)
      .toEqual(["Prohibited content: Cloudflare classifies the domain as Gambling."]);
    expect(decideCatalogAnalysis(candidate, analysis, taxonomy, [{ id: 131, name: "Phishing" }]).outcome).toBe("skip");
  });

  it("does not flag ordinary wording", () => {
    for (const tagline of ["Adult learning courses built with AI.", "Sex education answers for parents.", "Bet on your roadmap with AI planning."]) {
      expect(decideCatalogAnalysis(candidate, { ...analysis, tagline }, taxonomy).outcome).toBe("auto_publish");
    }
  });
});
