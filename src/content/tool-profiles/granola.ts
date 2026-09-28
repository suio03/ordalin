// Editorial sample: official sources checked on 2026-09-21.
// Keep evidence dates separate from catalogue/screenshot check timestamps.
export const granolaProfile = {
  title: "Granola — AI Meeting Notes & Pricing",
  description: "Compare Granola’s free and paid plans, understand its 30-day free history limit, and decide whether its bot-free meeting notes fit your workflow.",
  tagline: "AI meeting notes built from the conversation and the points you choose to write down.",
  overview: "Granola combines a meeting transcript, your own notes and calendar context into an editable summary. On desktop, it captures microphone and system audio without adding a bot to the call. You can then revisit the discussion or ask questions across meetings.",
  checkedAt: "2026-09-21",
  checkedLabel: "21 September 2026",
  platforms: "macOS · Windows · iOS · Android",
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
  },
  features: [
    { title: "Keep your own emphasis", text: "Turn your notes and the meeting transcript into a summary you can edit or regenerate.", source: "notes" },
    { title: "Check a summary against its source", text: "Inspect the transcript or raw notes behind a summary point.", source: "notes" },
    { title: "Carry context between meetings", text: "Ask questions across meetings, share folders and reuse note templates.", source: "pricing" },
  ],
  bestFor: "Customer interviews, recurring 1:1s and project meetings where you want an editable recap shaped by your own notes. Works across meeting apps through device audio capture.",
  plans: [
    { name: "Basic", price: "$0", cadence: "Free", detail: "AI notes, Chat, shared folders and templates. In-app history covers the last 30 days; integrations are limited to Slack." },
    { name: "Business", price: "$14", cadence: "per user / month · monthly billing", detail: "Unlimited notes and history, advanced AI models, CRM and workflow integrations, MCP and API access, plus centralized billing." },
    { name: "Enterprise", price: "From $35", cadence: "per user / month · annual contracts available", detail: "Adds organization-wide security and sharing policies, retention controls, and priority support. The billing guide specifies SSO for teams of 50+ users." },
  ],
  billingNote: "Paid workspaces bill per active member, with one plan tier for everyone. Confirm current pricing and SSO eligibility with Granola.",
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
