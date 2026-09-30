import type { EditorialPage } from "@/lib/editorial/types";

// Template fixtures for `pnpm dev:demo` only. They reference demo seed tools,
// stay drafts, and are never registered outside the isolated demo.
const author = "Ordalin demo fixture";

export const demoEditorialPages: EditorialPage[] = [
  {
    kind: "best",
    slug: "demo-dictation-tools",
    title: "Demo: dictation and speech tools",
    description: "Template fixture that shows how a best-of page renders live catalogue facts beside editorial judgement.",
    author,
    publishedAt: "2026-09-30",
    status: "draft",
    groupSlug: "audio",
    intro: ["This fixture exercises the best-of template with demo seed tools. It is not an editorial recommendation."],
    criteria: [
      { title: "Where the text lands", text: "Whether output is typed into the current app or kept in a separate workspace." },
      { title: "Local or hosted", text: "Whether speech is processed on the device or sent to a hosted service." },
    ],
    picks: [
      { toolSlug: "zen-whisper", label: "Fixture pick: local Mac dictation", bestFor: "Mac users who want dictation to stay on the device.", notIdealIf: "You work on Windows.", summary: ["Fixture text describing why this pick differs from the others."] },
      { toolSlug: "lispr", label: "Fixture pick: push-to-talk", bestFor: "People who dictate short bursts into many desktop apps.", notIdealIf: "You need long meeting transcripts.", summary: ["Fixture text describing why this pick differs from the others."] },
      { toolSlug: "hearsub", label: "Fixture pick: video subtitles", bestFor: "Viewers who want translated subtitles on YouTube.", notIdealIf: "You want to dictate your own writing.", summary: ["Fixture text describing why this pick differs from the others."] },
    ],
    decisionGuide: [
      { situation: "Dictation must stay on my Mac", toolSlug: "zen-whisper" },
      { situation: "I dictate short notes into many apps", toolSlug: "lispr" },
      { situation: "I watch videos in other languages", toolSlug: "hearsub" },
    ],
    closing: ["Fixture closing paragraph."],
    faq: [
      { question: "Is this a real recommendation?", answer: "No. It is a demo fixture for the template." },
      { question: "Where do prices come from?", answer: "From each tool's researched profile, when one exists." },
      { question: "Why is it a draft?", answer: "Fixtures never publish." },
    ],
  },
  {
    kind: "alternatives",
    slug: "coldtea",
    title: "Demo: Coldtea alternatives",
    description: "Template fixture that shows how an alternatives page frames other tools against one well-known anchor product.",
    author,
    publishedAt: "2026-09-30",
    status: "draft",
    groupSlug: "coding",
    anchorSlug: "coldtea",
    intro: ["This fixture exercises the alternatives template. It is not an editorial recommendation."],
    whySwitch: ["You only need one part of the workflow.", "You want to run models locally."],
    picks: [
      { toolSlug: "superflow-ai", label: "Fixture pick: checklist QA", bestFor: "Teams that review staging sites by checklist.", notIdealIf: "You want an editor.", summary: ["Fixture text."] },
      { toolSlug: "testmu-ai", label: "Fixture pick: cross-browser testing", bestFor: "QA teams covering many browsers and devices.", notIdealIf: "You are a solo developer.", summary: ["Fixture text."] },
      { toolSlug: "lumichats-offline", label: "Fixture pick: offline models", bestFor: "Windows users who want local models without a GPU.", notIdealIf: "You need release testing.", summary: ["Fixture text."] },
    ],
    decisionGuide: [
      { situation: "I review staging sites by checklist", toolSlug: "superflow-ai" },
      { situation: "I need broad device coverage", toolSlug: "testmu-ai" },
    ],
    faq: [
      { question: "Is this a real recommendation?", answer: "No. It is a demo fixture for the template." },
      { question: "Where do prices come from?", answer: "From each tool's researched profile, when one exists." },
      { question: "Why is it a draft?", answer: "Fixtures never publish." },
    ],
  },
  {
    kind: "compare",
    slug: "zen-whisper-vs-lispr",
    title: "Demo: Zen Whisper vs Lispr",
    description: "Template fixture that shows how a head-to-head comparison page renders a verdict, differences and live facts.",
    author,
    publishedAt: "2026-09-30",
    status: "draft",
    groupSlug: "audio",
    intro: ["This fixture exercises the comparison template. It is not an editorial recommendation."],
    verdict: "Fixture verdict: choose by operating system and whether translation matters.",
    sides: [
      { toolSlug: "zen-whisper", chooseIf: ["You work on a Mac.", "You want processing to stay local."] },
      { toolSlug: "lispr", chooseIf: ["You want push-to-talk.", "You also need translation."] },
    ],
    differences: [
      { topic: "Input style", left: "Fixture.", right: "Fixture." },
      { topic: "Processing", left: "Fixture.", right: "Fixture." },
      { topic: "Translation", left: "Fixture.", right: "Fixture." },
      { topic: "Platforms", left: "Fixture.", right: "Fixture." },
    ],
    faq: [
      { question: "Is this a real recommendation?", answer: "No. It is a demo fixture for the template." },
      { question: "Where do prices come from?", answer: "From each tool's researched profile, when one exists." },
      { question: "Why is it a draft?", answer: "Fixtures never publish." },
    ],
  },
];
