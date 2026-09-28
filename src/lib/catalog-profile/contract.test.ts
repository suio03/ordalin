import { checkResearchedProfile, readResearchedProfile } from "./contract";
import { parseCatalogAnalysis } from "../catalog-analysis/contract";
import type { CatalogEnrichmentCandidate } from "../catalog-enrichment/contract";

const url = "https://example.com/pricing";
const quote = "The Pro plan costs $12 per user per month and includes unlimited exports.";
const candidate: CatalogEnrichmentCandidate = {
  schemaVersion: 1, status: "pending_review", websiteUrl: "https://example.com/", canonicalDomain: "example.com",
  fetchedAt: "2026-09-22T00:00:00Z", identity: { name: null, tagline: null }, assets: [], pricingSignals: [], platforms: [], officialLinks: [], warnings: [],
  evidencePages: [{ url, role: "pricing", title: "Pricing", description: null, headings: [], excerpt: quote }],
};
const claim = { text: "Exports are included.", evidence: [{ url, quote }] };
const profile = {
  schemaVersion: 1, overview: claim, pricingSummary: claim,
  platforms: [], features: ["Export", "Edit", "Review"].map(title => ({ ...claim, title, text: `${title} your content.` })),
  plans: [{ name: "Pro", price: "$12", cadence: "per user / month", detail: "Unlimited exports.", evidence: claim.evidence }],
  billingNotes: [claim], freeLimits: [], useCases: [claim], limitations: [],
  unverified: ["platforms", "freeLimits", "limitations"],
};
describe("researched import profiles", () => {
  it("round trips through analysis parsing and stored import JSON with the evidence date", () => {
    const analysis = parseCatalogAnalysis({ profile });
    const read = readResearchedProfile(JSON.stringify({ analysis, candidate }));
    expect(read?.plans[0].price).toBe("$12");
    expect(read?.checkedAt).toBe(candidate.fetchedAt);
  });
  it("rejects a basic summary, fabricated quotes, and unfetched sources", () => {
    expect(checkResearchedProfile(undefined, candidate).profile).toBeNull();
    for (const evidence of [[{ url, quote: "A completely fabricated product claim." }], [{ url: "https://directory.example", quote }]]) {
      expect(checkResearchedProfile({ ...profile, overview: { ...claim, evidence } }, candidate).profile).toBeNull();
    }
  });
  it("requires plan differences and three distinct features", () => {
    expect(checkResearchedProfile({ ...profile, plans: [] }, candidate).profile).toBeNull();
    expect(checkResearchedProfile({ ...profile, features: [profile.features[0], profile.features[0], profile.features[0]] }, candidate).profile).toBeNull();
  });
  it("distinguishes unverified limitations from an invented no-limit claim", () => {
    expect(checkResearchedProfile(profile, candidate).reasons).toEqual([]);
    expect(checkResearchedProfile({ ...profile, unverified: [] }, candidate).profile).toBeNull();
    expect(checkResearchedProfile({ ...profile, limitations: [{ ...claim, title: "No limits" }] }, candidate).profile).toBeNull();
  });
  it("fails closed for corrupt stored profiles", () => {
    expect(readResearchedProfile("{bad")).toBeNull();
    expect(readResearchedProfile(JSON.stringify({ analysis: { profile } }))).toBeNull();
  });
});
