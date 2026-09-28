import { confirmProfile, emptyDetails, readDetailFields, supportedDetails } from "./profile";
import { fallbackCatalogAnalysis } from "@/lib/catalog-analysis/fallback";
import type { CatalogEnrichmentCandidate } from "@/lib/catalog-enrichment/contract";

const candidate: CatalogEnrichmentCandidate = {
  schemaVersion: 1, status: "pending_review", websiteUrl: "https://example.com/", canonicalDomain: "example.com", fetchedAt: "2026-09-21T00:00:00Z",
  identity: { name: { value: "Example", sourceUrl: "https://example.com/" }, tagline: null }, assets: [], pricingSignals: [], platforms: [], officialLinks: [], warnings: [],
  evidencePages: [{ url: "https://example.com/", role: "homepage", title: "Example", description: "", headings: [], excerpt: "Export your meeting notes as Markdown." }],
};

describe("confirmed submission provenance", () => {
  it("discards invented source URLs and quotes absent from the fetched page", () => {
    const details = emptyDetails();
    details.features = { text: "Export Markdown.", sourceUrl: candidate.websiteUrl, quote: "Export your meeting notes as Markdown." };
    details.limitations = { text: "Cannot export audio.", sourceUrl: candidate.websiteUrl, quote: "Cannot export audio." };
    details.pricingDetails = { text: "Free forever.", sourceUrl: "https://unfetched.example/", quote: "Export your meeting notes as Markdown." };
    expect(supportedDetails(details, candidate).features.text).toBe("Export Markdown.");
    expect(supportedDetails(details, candidate).limitations.text).toBe("");
    expect(supportedDetails(details, candidate).pricingDetails.text).toBe("");
  });
  it("removes website provenance when a submitter rewrites a field", () => {
    const analysis = fallbackCatalogAnalysis(candidate, { categories: [], tags: [] });
    analysis.details = emptyDetails();
    analysis.details.features = { text: "Export Markdown.", sourceUrl: candidate.websiteUrl, quote: "Export your meeting notes as Markdown." };
    const details = { features: "Export video.", pricingDetails: "", useCases: "", limitations: "" };
    const confirmed = confirmProfile(candidate, analysis, { ...analysis }, details, "uploaded");
    expect(confirmed.fields.name).toMatchObject({ origin: "website", checkedAt: candidate.fetchedAt });
    expect(confirmed.fields.features).toEqual({ text: "Export video.", origin: "submitter", sources: [], checkedAt: null });
    expect(confirmed.fields.limitations.text).toBe("");
  });
  it("keeps optional sections blank and rejects oversized content", () => {
    const form = new FormData();
    expect(readDetailFields(form)).toEqual({ features: "", pricingDetails: "", useCases: "", limitations: "" });
    form.set("features", "a".repeat(1201));
    expect(() => readDetailFields(form)).toThrow("1200");
  });
});
