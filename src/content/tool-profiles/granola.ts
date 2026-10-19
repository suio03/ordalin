// Editorial sample: official sources checked on 2026-10-19.
// Keep evidence dates separate from catalogue/screenshot check timestamps.
export const granolaProfile = {
  title: "Granola — AI Meeting Notes & Pricing",
  description: "Compare Granola’s free and paid plans, understand its 30-day free history limit, and decide whether its bot-free meeting notes fit your workflow.",
  tagline: "AI meeting notes built from the conversation and the points you choose to write down.",
  overview: "Granola combines a meeting transcript, your own notes and calendar context into an editable summary. On desktop, it captures microphone and system audio without adding a bot to the call. You can then revisit the discussion or ask questions across meetings.",
  checkedAt: "2026-10-19",
  checkedLabel: "19 October 2026",
  platforms: "macOS · Windows · iOS · Android · Apple Watch",
  // Short facts for comparison tables, which otherwise read researched D1 profiles.
  pricingSummary: "Basic is free with 30 days of in-app history. Business is $14 per user a month, billed monthly; Enterprise starts at $35 per user a month.",
  screenshot: "/editorial/granola-website.webp",
  logo: "/editorial/granola-logo.webp",
  sources: {
    pricing: { label: "Official pricing", url: "https://www.granola.ai/pricing" },
    billing: { label: "Plans & billing", url: "https://docs.granola.ai/help-center/managing-your-account/subscriptions-and-billing" },
    notes: { label: "How notes are generated", url: "https://docs.granola.ai/help-center/taking-notes/ai-enhanced-notes" },
    capture: { label: "Transcription guide", url: "https://docs.granola.ai/help-center/taking-notes/transcription" },
    setup: { label: "Supported platforms", url: "https://docs.granola.ai/help-center/getting-started/setting-up-granola-for-the-first-time" },
    privacy: { label: "Audio & privacy FAQ", url: "https://docs.granola.ai/help-center/consent-security-privacy/security-privacy-data-faqs" },
    training: { label: "Model training controls", url: "https://docs.granola.ai/help-center/consent-security-privacy/model-training" },
    languages: { label: "Supported languages", url: "https://docs.granola.ai/help-center/customising-granola/multi-language" },
  },
  features: [
    { title: "Keep your own emphasis", text: "Turn your notes and the meeting transcript into a summary you can edit or regenerate.", source: "notes" },
    { title: "Check a summary against its source", text: "Inspect the transcript or raw notes behind a summary point.", source: "notes" },
    { title: "Carry context between meetings", text: "Ask questions across meetings, share folders and reuse note templates.", source: "pricing" },
    { title: "Switch languages mid-meeting", text: "The desktop apps transcribe 31 languages and can follow a meeting that moves between them; the mobile apps cover 17.", source: "languages" },
  ],
  bestFor: "Customer interviews, recurring 1:1s and project meetings where you want an editable recap shaped by your own notes. Works across meeting apps through device audio capture.",
  plans: [
    { name: "Basic", price: "$0", cadence: "Free", detail: "AI notes, Chat, shared folders, templates and recipes. In-app history covers the last 30 days; integrations are limited to Slack, and MCP reaches personal notes from the last 30 days." },
    { name: "Business", price: "$14", cadence: "per user / month · monthly billing", detail: "Unlimited notes and history, model choice in Chat, pre-meeting briefs and follow-up emails, integrations with Notion, HubSpot, Attio, Affinity and Zapier, MCP and API access, plus centralized billing." },
    { name: "Enterprise", price: "From $35", cadence: "per user / month · annual billing available", detail: "Adds organization-wide security and sharing policies, retention controls, SCIM, Salesforce integration, HIPAA-compliant workspaces and dedicated support. The billing guide specifies SSO for teams of 50+ users." },
  ],
  billingNote: "Paid workspaces bill per active member, with one plan tier for everyone. Business is billed monthly; annual billing is for Enterprise contracts only. The mobile apps are free to use. Accepted startups and students can get 12 months of Business free, and registered nonprofits can apply for 50% off.",
  freeLimit: "No daily transcription cap. Notes older than 30 days are stored but hidden on Basic. Export historical titles and summaries as CSV, or upgrade for in-app access.",
  limitations: [
    { title: "You need to start the session", text: "Start capture in the desktop or mobile app. The web interface only views and edits existing notes.", source: "capture" },
    { title: "It is not an audio archive", text: "Audio is deleted after transcription, so you cannot replay the original recording.", source: "privacy" },
    { title: "Check consent and model-training settings", text: "Obtain participant consent. Model-training opt-out is available; Enterprise workspaces are opted out by default.", source: "training", additionalSource: "privacy" },
  ],

} as const;

export function getToolProfile(slug: string) {
  return slug === "granola" ? granolaProfile : undefined;
}
export type ToolProfile = typeof granolaProfile;
export type ProfileSource = keyof ToolProfile["sources"];
