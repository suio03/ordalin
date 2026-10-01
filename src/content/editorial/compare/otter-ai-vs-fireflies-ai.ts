import type { ComparePage } from "@/lib/editorial/types";

export const otterVsFireflies: ComparePage = {
  kind: "compare",
  slug: "otter-ai-vs-fireflies-ai",
  title: "Otter.ai vs Fireflies.ai: which AI meeting assistant should you use?",
  description: "Otter and Fireflies both record, transcribe and summarise meetings. We compare free limits, capture options, languages and follow-up automation.",
  author: "Ordalin",
  publishedAt: "2026-10-01",
  status: "published",
  groupSlug: "productivity",
  intro: [
    "Otter.ai and Fireflies.ai join or record your meetings, transcribe them, and turn them into summaries and action items you can search later. Both have free plans and per-seat paid tiers. They differ in how clear the free allowance is, how many languages they cover, and what happens to meeting output afterwards.",
    "This comparison is based on each company's official pricing pages and documentation, checked on the dates shown. We did not run the same meetings through both tools.",
  ],
  verdict: "Choose Otter if you want live transcripts with a clearly defined free monthly allowance, desktop apps for Mac and Windows, and meeting notes synced into a CRM. Choose Fireflies if you transcribe in many languages and want meetings to trigger follow-ups such as draft emails, project tasks and candidate scoring.",
  sides: [
    {
      toolSlug: "otter-ai",
      chooseIf: [
        "You want to read the transcript live while the meeting is happening.",
        "You want a free plan with a stated allowance: 300 minutes a month and up to 30 minutes per conversation.",
        "Your sales team wants call notes and next steps synced to a CRM.",
      ],
    },
    {
      toolSlug: "fireflies-ai",
      chooseIf: [
        "Your meetings run in many languages; transcription covers more than 100.",
        "You want AI Skills to draft follow-up emails, extract details or score candidates after each call.",
        "You want action items created as tasks in your project-management tool.",
      ],
    },
  ],
  differences: [
    {
      topic: "Free plan",
      left: "300 minutes a month, 30 minutes per conversation, three lifetime file imports and the 25 most recent conversations.",
      right: "Limited AI summaries, 400 storage minutes per team and 20 AI credits. The pricing page describes free transcription inconsistently.",
    },
    {
      topic: "Paid entry tier (annual billing)",
      left: "Pro at $8.33 per user a month ($16.99 monthly), with 1,200 recording minutes and meetings up to 90 minutes.",
      right: "Pro at $10 per seat a month, with unlimited transcription and summaries and 8,000 storage minutes per seat.",
    },
    {
      topic: "Capturing meetings",
      left: "Meeting assistant, Mac and Windows desktop app, Chrome and mobile.",
      right: "Meeting bot, Chrome extension, mobile app and desktop app.",
    },
    {
      topic: "Languages",
      left: "Live transcripts in multiple languages, with speaker recognition.",
      right: "Transcription in more than 100 languages, with speaker identification.",
    },
    {
      topic: "After the meeting",
      left: "AI chat across meetings and connected apps, drafts of reports and follow-ups, and CRM updates.",
      right: "Questions to Fred about past meetings, AI Skills for follow-up emails and candidate scoring, and project tasks.",
    },
    {
      topic: "Team and admin limits",
      left: "Business allows meetings of up to four hours. SSO and SCIM require at least 100 licences.",
      right: "Business adds unlimited storage and team analytics. Enterprise, with SSO and SCIM, is annual-only at $39 per seat.",
    },
  ],
  faq: [
    {
      question: "Which free plan is more useful?",
      answer: "Otter's Basic plan states its limits clearly: 300 minutes a month and 30 minutes per conversation. Fireflies' free plan includes limited summaries, 400 storage minutes per team and 20 AI credits, but its pricing page describes free transcription inconsistently, so check the current allowance before relying on it.",
    },
    {
      question: "Is Fireflies' paid transcription really unlimited?",
      answer: "Paid Fireflies plans list unlimited transcription and summaries. AI credits are a separate allowance that does not become unlimited.",
    },
    {
      question: "Does Otter limit uploaded recordings?",
      answer: "Yes. Pro includes 10 file imports a month. Business and Enterprise cap imported-file transcription at 6,000 minutes per user a month, even though live meetings are unlimited.",
    },
    {
      question: "Did you test both assistants in the same meetings?",
      answer: "No. This comparison uses each vendor's official documentation and pricing, checked on the dates shown on each tool's profile.",
    },
  ],
};
