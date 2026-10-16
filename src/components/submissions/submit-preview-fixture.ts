import type { Draft } from "./submit-flow";

type Category = { slug: string };
type Tag = { slug: string; kind: string; groupSlug: string | null };

// A fictional draft so `pnpm dev` can show the review steps; local previews
// cannot call the enrich API. Never rendered in production.
export function previewDraft(categories: Category[], tags: Tag[]): Draft {
  const primary = categories.find(category => tags.some(tag => tag.kind === "category" && tag.groupSlug === category.slug))?.slug ?? categories[0]?.slug ?? "";
  const tagSlugs = tags.filter(tag => tag.kind === "category" && tag.groupSlug === primary).slice(0, 2).map(tag => tag.slug);
  const home = "https://example.com/";
  const pricing = "https://example.com/pricing";
  const features = "https://example.com/features";
  const page = (url: string, role: "homepage" | "pricing" | "features") => ({ url, role, title: "Notewell", description: null, headings: [], excerpt: "Plans from $12 per month. 300 free minutes." });
  return {
    draftId: "preview-draft",
    candidate: {
      schemaVersion: 1, status: "pending_review", websiteUrl: home, canonicalDomain: "example.com",
      fetchedAt: new Date().toISOString(), identity: { name: null, tagline: null },
      assets: [], pricingSignals: [], platforms: [], officialLinks: [],
      evidencePages: [page(home, "homepage"), page(pricing, "pricing"), page(features, "features")],
      warnings: [],
    },
    analysis: {
      schemaVersion: 1, isAiTool: true, name: "Notewell",
      tagline: "Records meetings and turns them into searchable notes and action items.",
      description: "Notewell joins video calls, transcribes the conversation and writes a structured summary with decisions and follow-ups. Notes can be searched across meetings and shared with the team.",
      pricingModel: "freemium", primaryCategorySlug: primary, categorySlugs: [primary], tagSlugs,
      evidence: { identity: [home], description: [home, features], pricing: [pricing], classification: [home] },
      details: {
        features: { text: "Automatic meeting transcription\nSummaries with decisions and action items\nSearch across all past meetings", sourceUrl: features },
        pricingDetails: { text: "Free plan with 300 transcription minutes per month. Pro costs $12 per user per month.", sourceUrl: pricing },
        useCases: { text: "", sourceUrl: "" },
      },
      needsReviewReasons: [],
    },
  };
}
