import { confirmProfile, emptyDetails, readDetailFields, supportedDetails } from "./profile";
import { fallbackCatalogAnalysis } from "@/lib/catalog-analysis/fallback";
import type { CatalogEnrichmentCandidate } from "@/lib/catalog-enrichment/contract";

const candidate: CatalogEnrichmentCandidate = {
  schemaVersion: 1, status: "pending_review", websiteUrl: "https://example.com/", canonicalDomain: "example.com", fetchedAt: "2026-09-21T00:00:00Z",
  identity: { name: { value: "Example", sourceUrl: "https://example.com/" }, tagline: null }, assets: [], pricingSignals: [], platforms: [], officialLinks: [], warnings: [],
  evidencePages: [{ url: "https://example.com/", role: "homepage", title: "Example", description: "", headings: [], excerpt: "Export your meeting notes as Markdown." }],
};

describe("confirmed submission provenance", () => {
  it("discards invented source URLs and numbers absent from the fetched page", () => {
    const details = emptyDetails();
    details.features = { text: "Export Markdown.", sourceUrl: candidate.websiteUrl };
    details.useCases = { text: "Export 4 formats.", sourceUrl: candidate.websiteUrl };
    details.pricingDetails = { text: "Free forever.", sourceUrl: "https://unfetched.example/" };
    expect(supportedDetails(details, candidate).features.text).toBe("Export Markdown.");
    expect(supportedDetails(details, candidate).useCases.text).toBe("");
    expect(supportedDetails(details, candidate).pricingDetails.text).toBe("");
  });
  it("accepts rewritten prose when its numbers appear on the page", () => {
    const page = { ...candidate.evidencePages[0], excerpt: "Creator US$ 12.5 /mo $150.00 billed annually 300 credits / month Up to 1,000 images − 29 %" };
    const priced = { ...candidate, evidencePages: [page] };
    const details = emptyDetails();
    details.pricingDetails = { text: "Creator: US$12.50/month ($150 billed annually), 300 credits per month, up to 1000 images. Save 29% yearly.", sourceUrl: page.url };
    details.useCases = { text: "Creator: US$15/month.", sourceUrl: page.url };
    const result = supportedDetails(details, priced);
    expect(result.pricingDetails.text).toContain("US$12.50/month");
    expect(result.useCases.text).toBe("");
  });
  it("accepts numbers stated on another fetched page", () => {
    const pricing = { ...candidate.evidencePages[0], url: "https://example.com/pricing", role: "pricing" as const, excerpt: "Up to 15 5-second videos" };
    const site = { ...candidate, evidencePages: [candidate.evidencePages[0], pricing] };
    const details = emptyDetails();
    details.features = { text: "Generate 5-second videos.", sourceUrl: candidate.websiteUrl };
    expect(supportedDetails(details, site).features.text).toBe("Generate 5-second videos.");
  });
  it("removes website provenance when a submitter rewrites a field", () => {
    const analysis = fallbackCatalogAnalysis(candidate, { categories: [], tags: [] });
    analysis.details = emptyDetails();
    analysis.details.features = { text: "Export Markdown.", sourceUrl: candidate.websiteUrl };
    const details = { features: "Export video.", pricingDetails: "", useCases: "" };
    const confirmed = confirmProfile(candidate, analysis, { ...analysis }, details, "uploaded");
    expect(confirmed.fields.name).toMatchObject({ origin: "website", checkedAt: candidate.fetchedAt });
    expect(confirmed.fields.features).toEqual({ text: "Export video.", origin: "submitter", sources: [], checkedAt: null });
    expect(confirmed.fields.useCases.text).toBe("");
  });
  it("keeps optional sections blank and rejects oversized content", () => {
    const form = new FormData();
    expect(readDetailFields(form)).toEqual({ features: "", pricingDetails: "", useCases: "" });
    form.set("features", "a".repeat(1201));
    expect(() => readDetailFields(form)).toThrow("1200");
  });
});
