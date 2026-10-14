import type { ComparePage } from "@/lib/editorial/types";

export const argonVsOpus: ComparePage = {
  kind: "compare",
  slug: "gemini-4-argon-vs-claude-opus-5-5",
  title: "Argon vs Opus: Gemini 4 Argon or Claude Opus 5.5 for coding agents and long tasks?",
  description: "Gemini 4 Argon and Claude Opus 5.5 compared on API price before and after December 1, context, output length, thinking control, platforms and limits.",
  author: "Ordalin",
  publishedAt: "2026-10-15",
  updatedAt: "2026-10-15",
  status: "published",
  groupSlug: "coding",
  intro: [
    "Gemini 4 Argon (Google) and Claude Opus 5.5 (Anthropic) are each vendor's current flagship for hard coding, long-running agents and research work. Both read up to 1M tokens of context, and from December 1, 2026 both list $4 per million input tokens and $20 per million output tokens. The choice comes down to timing, how much output you need from one task, which modalities and tools you use, and where you already run your models.",
    "This comparison is based on Google's Gemini 4 Argon launch posts, model card, Gemini API model page and pricing page, and on Anthropic's Opus 5.5 launch page and Claude Platform documentation, checked on the dates shown. We did not run the same workloads through both models. Benchmark figures below come from the vendors and are labelled as such.",
  ],
  verdict: "Choose Gemini 4 Argon if you want the cheaper price before December 1, need video, audio or PDF input, or need very long single outputs through long decode. Choose Claude Opus 5.5 if you run long agentic coding jobs, want it on AWS, Google Cloud or Azure, or want the same model in the Claude apps and Claude Code.",
  sides: [
    {
      toolSlug: "gemini-4-argon",
      chooseIf: [
        "You start before December 1, 2026: Argon's introductory price is $2 input and $10 output per million tokens, half of Opus 5.5's.",
        "You need one task to produce very long output: long decode can generate up to about 1M tokens, while Opus 5.5 stops at 128K (300K on Batch in beta).",
        "Your inputs include video, audio or PDF files as well as text and images.",
        "You want built-in Google Search and Maps grounding, code execution and URL context in the Gemini API, or Flex processing at half price.",
      ],
    },
    {
      toolSlug: "claude-opus-5-5",
      chooseIf: [
        "You run long, unattended agentic coding jobs such as codebase-wide migrations; Anthropic reports 66.4% on Terminal-Bench 4.0, and Google's own Argon model card lists Argon at 57.4% on the same test.",
        "You need the model on Amazon Bedrock, Google Cloud or Microsoft Foundry as well as the vendor's API.",
        "You want a newer knowledge cutoff: June 2026, against March 2026 for Argon.",
        "You also want it in the Claude apps on Pro, Max, Team or Enterprise plans and in Claude Code, including Fast mode at up to 2.5x speed.",
      ],
    },
  ],
  differences: [
    {
      topic: "API price",
      left: "$2 input and $10 output per million tokens through November 30, 2026, then $4 and $20 from December 1. Output price includes thinking tokens. No surcharge for long prompts.",
      right: "$4 input and $20 output per million tokens. US-only inference costs 1.1x.",
    },
    {
      topic: "Caching and discounts",
      left: "Implicit caching only, on prompts of at least 4,096 tokens: $0.10 per million cached tokens ($0.20 from December 1). Batch and Flex at half price, Priority at 1.8x.",
      right: "Cache reads $0.20; cache writes $5 (5-minute) or $8 (1-hour). Batch API at 50% off. Fast mode at $8 input and $40 output.",
    },
    {
      topic: "Context and output",
      left: "1,048,576-token window shared by input, thinking and output. Per request: 32K output without streaming, 64K with streaming; long decode continues up to the full window.",
      right: "1M-token context window and 128K max output, or up to 300K output on the Batch API in beta.",
    },
    {
      topic: "Knowledge cutoff",
      left: "March 2026.",
      right: "June 2026 (reliable knowledge cutoff).",
    },
    {
      topic: "Reasoning control",
      left: "thinking_level low, medium (default) or high.",
      right: "Adaptive thinking is always on; effort runs from low to max, with medium as the default.",
    },
    {
      topic: "Inputs and outputs",
      left: "Text, image, video, audio and PDF in; text out. No image or audio generation and no Live API.",
      right: "Text and image in; text out. Computer use reported at 81.8% on OSWorld 2.1 (partial).",
    },
    {
      topic: "Where it runs",
      left: "Gemini API paid tier and Google AI Studio (model ID gemini-4-argon), Android Studio and Antigravity, and the Gemini app for Google AI Pro and Ultra subscribers.",
      right: "Claude Platform API (claude-opus-5-5), Amazon Bedrock, Google Cloud, Microsoft Foundry and Claude Platform on AWS, plus the Claude apps on paid plans and Claude Code.",
    },
    {
      topic: "Stated limits",
      left: "Not on the Gemini API Free tier. Explicit caching returns an error, sampling parameters such as temperature are ignored, and Google advises client timeouts of at least 20 minutes.",
      right: "Thinking cannot be turned off, and four breaking changes affect code written for Opus 5. Most cybersecurity tasks are re-routed to Opus 4.8. Fast mode is a Claude API research preview only.",
    },
  ],
  faq: [
    {
      question: "Are \"Argon\" and \"Opus\" the same as Gemini 4 Argon and Claude Opus 5.5?",
      answer: "Yes, in current searches. Gemini 4 Argon is Google's first Gemini 4 model, announced on September 30, 2026, with the API model ID gemini-4-argon. Claude Opus 5.5 is Anthropic's Opus-tier model, released on September 22, 2026, with the API model ID claude-opus-5-5.",
    },
    {
      question: "Which one is cheaper?",
      answer: "Until November 30, 2026 Gemini 4 Argon costs half as much per token: $2 input and $10 output per million, against $4 and $20 for Opus 5.5. From December 1 Argon's standard price rises to $4 and $20, the same as Opus 5.5. Both count thinking tokens as output, so the cost of a task also depends on how many tokens each model spends, which we did not measure.",
    },
    {
      question: "Is there a free way to use either model?",
      answer: "Not on the APIs: Argon is not on the Gemini API Free tier, and Opus 5.5 is billed per token. In consumer apps, Argon is in the Gemini app for Google AI Pro and Ultra subscribers, and Opus 5.5 is in the Claude apps on Pro, Max, Team and Enterprise plans. Neither vendor lists it on a free consumer plan.",
    },
    {
      question: "Which is better for coding agents?",
      answer: "Both vendors aim their model at long agentic coding. On the benchmarks they share, Google's Argon model card reports Argon ahead on DeepSWE (77.9% vs 74.2%) and behind on Terminal-Bench 4.0 (57.4% vs 66.4%) and FrontierSWE (55.0% vs 62.3%). These are vendor-reported scores, not our tests, so try both on your own repository.",
    },
    {
      question: "Did you test the two models against each other?",
      answer: "No. This comparison uses each vendor's official documentation, pricing and published benchmarks, checked on October 15, 2026.",
    },
  ],
};
