import { analyzeCatalogCandidate } from "./analyze";
import type { CatalogEnrichmentCandidate } from "@/lib/catalog-enrichment/contract";
import type { CatalogTaxonomy } from "./contract";

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
  identity: {
    name: { value: "Example AI", sourceUrl: "https://example.com/" },
    tagline: { value: "A factual coding assistant.", sourceUrl: "https://example.com/" },
  },
  assets: [],
  pricingSignals: [{ value: "paid", sourceUrl: "https://example.com/pricing" }],
  platforms: [],
  officialLinks: [],
  evidencePages: [{ url: "https://example.com/", role: "homepage", title: "Example AI", description: null, headings: [], excerpt: "Example AI helps developers review code." }],
  warnings: [],
};

describe("OpenAI catalogue analysis", () => {
  it("requests strict structured output and parses the result", async () => {
    let requestBody: Record<string, unknown> | null = null;
    const fetcher = async (_input: string | URL | Request, init?: RequestInit) => {
      requestBody = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({
        output_text: JSON.stringify({
          schemaVersion: 1,
          isAiTool: true,
          name: "Example AI",
          tagline: "Review code with evidence from the current repository.",
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
        }),
      }), { headers: { "content-type": "application/json" } });
    };

    const result = await analyzeCatalogCandidate(candidate, taxonomy, {
      apiKey: "test-key",
      fetcher: fetcher as typeof fetch,
    });

    expect(result.primaryCategorySlug).toBe("coding");
    expect(result.tagSlugs).toEqual(["coding-assistant"]);
    expect(requestBody).toMatchObject({
      model: "gpt-5.6-luna",
      store: false,
      text: { format: { type: "json_schema", strict: true } },
    });
    expect(JSON.stringify(requestBody)).toContain("untrusted data");
  });
});
