export const topLevelCategories = [
  { slug: "writing", name: "Writing & Language" },
  { slug: "image", name: "Image & Design" },
  { slug: "video", name: "Video & Animation" },
  { slug: "audio", name: "Voice & Speech" },
  { slug: "music", name: "Music & Audio" },
  { slug: "coding", name: "Coding & Development" },
  { slug: "agents", name: "Automation & Agents" },
  { slug: "productivity", name: "Productivity" },
  { slug: "research", name: "Research & Data" },
  { slug: "marketing", name: "Marketing & Sales" },
  { slug: "business", name: "Business & Operations" },
  { slug: "education", name: "Education & Learning" },
  { slug: "lifestyle", name: "Personal & Lifestyle" },
  { slug: "other", name: "Other" },
] as const;

export const toolStatuses = [
  "imported",
  "pending_review",
  "published",
  "rejected",
  "archived",
] as const;

export const pricingModels = [
  "free",
  "freemium",
  "paid",
  "free_trial",
  "contact_sales",
  "unknown",
] as const;

export const sourceProviders = [
  "product_hunt",
  "toolify",
  "submission",
  "manual",
] as const;

export const importCandidateStatuses = [
  "discovered",
  "analyzed",
  "pending_review",
  "published",
  "skipped",
  "rejected",
  "failed",
] as const;

export const tagKinds = ["category", "interface", "attribute"] as const;

export type ToolStatus = (typeof toolStatuses)[number];
export type PricingModel = (typeof pricingModels)[number];
export type SourceProvider = (typeof sourceProviders)[number];
export type ImportCandidateStatus = (typeof importCandidateStatuses)[number];
export type TagKind = (typeof tagKinds)[number];
