import type { ComparePage } from "@/lib/editorial/types";

export const haikuVsLuna: ComparePage = {
  kind: "compare",
  slug: "claude-haiku-5-5-vs-gpt-6-luna",
  title: "Haiku 5.5 vs Luna 6: Claude Haiku 5.5 or GPT-6 Luna for high-volume API work?",
  description: "Claude Haiku 5.5 and GPT-6 Luna list the same base API price. We compare long-prompt pricing, context, tools, platforms and limits.",
  author: "Ordalin",
  publishedAt: "2026-10-08",
  updatedAt: "2026-10-08",
  status: "published",
  groupSlug: "coding",
  intro: [
    "Claude Haiku 5.5 (Anthropic) and GPT-6 Luna (OpenAI, often searched as \"Luna 6\") are each vendor's smallest current model, built for cheap, high-volume work such as classification, summaries and subagents. Both list $0.10 per million input tokens and $0.50 per million output tokens for ordinary prompts, so the choice comes down to what happens with long prompts, which tools and clouds you need, and how much agentic work you expect from a small model.",
    "This comparison is based on Anthropic's Haiku 5.5 launch page, models overview and pricing documentation, and OpenAI's GPT-6 Luna model and pricing documentation, checked on the dates shown. We did not run the same workloads through both models, and the two vendors publish different benchmarks, so we do not rank their quality against each other.",
  ],
  verdict: "Both have roughly 1M tokens of context, 128K output and half-price batch processing, so the deciding factors are long prompts, tools and where you work. Choose GPT-6 Luna if your prompts often run past 100K tokens or you want hosted tools such as web search and code interpreter through the Responses API. Choose Claude Haiku 5.5 if you already build on Claude, need it on AWS, Google Cloud or Azure, or also want it in the Claude app and Claude Code as a fast subagent alongside Sonnet 5.5 or Opus 5.5.",
  sides: [
    {
      toolSlug: "claude-haiku-5-5",
      chooseIf: [
        "You run Claude Sonnet 5.5 or Opus 5.5 and want a cheaper subagent for lookups, summaries and compaction.",
        "You need the model on Amazon Web Services, Google Cloud or Microsoft Azure as well as the vendor's own API.",
        "You are building live customer-support or browser-use agents where latency matters; Anthropic reports 72.4% on an OSWorld 2.1 subset.",
        "You want the same model in the Claude app, including the Free plan, and in Claude Code.",
      ],
    },
    {
      toolSlug: "gpt-6-luna",
      chooseIf: [
        "Your prompts regularly exceed 100K tokens: Luna keeps its base price up to 272K input tokens, while Haiku 5.5 charges five times more past 100K.",
        "You want Flex processing at half price as well as Batch, or Fast mode at twice the price for lower latency.",
        "You want hosted web search, file search, code interpreter, computer use and MCP through the Responses API.",
        "You need EU data residency for Standard, Flex and Batch processing.",
      ],
    },
  ],
  differences: [
    {
      topic: "Base API price",
      left: "$0.10 input and $0.50 output per million tokens for prompts up to 100K tokens. Cache reads $0.01, cache writes $0.125.",
      right: "$0.10 input and $0.50 output per million tokens. Cached input $0.01, cache writes $0.125.",
    },
    {
      topic: "Long prompts",
      left: "Over 100K tokens: $0.50 input and $2.50 output, five times the base rate.",
      right: "Over 272K input tokens: 2x input and 1.5x output ($0.20 and $0.75) for the whole request.",
    },
    {
      topic: "Discounted processing",
      left: "Batch API at 50% ($0.05 input, $0.25 output; $0.25 and $1.25 over 100K tokens).",
      right: "Batch and Flex at 50% of Standard ($0.05 input, $0.25 output); Fast mode at 2x.",
    },
    {
      topic: "Context and output",
      left: "1M-token context window, 128K max output tokens, June 2026 cutoff.",
      right: "1,050,000-token context window, 128,000 max output tokens, May 18, 2026 knowledge cutoff.",
    },
    {
      topic: "Reasoning control",
      left: "The first Haiku-class model with an adjustable effort setting.",
      right: "reasoning.effort from none to max, with medium as the default.",
    },
    {
      topic: "Tools and agents",
      left: "Positioned as a coding subagent and for browser use; the Claude SDKs add computer and browser use in beta.",
      right: "Web search, file search, code interpreter, hosted shell, computer use, MCP and tool search in the Responses API.",
    },
    {
      topic: "Where it runs",
      left: "Claude Platform API (claude-haiku-5-5), Amazon Web Services, Google Cloud and Microsoft Azure, plus the Claude app and Claude Code.",
      right: "OpenAI API (gpt-6-luna), with EU data residency for Standard, Flex and Batch. Not on the API's Free tier.",
    },
    {
      topic: "Stated limits",
      left: "Anthropic says Sonnet 5.5 and Opus 5.5 remain better for complex agentic coding. Attacker-style security work is blocked.",
      right: "No audio or video, images as input only, and no fine-tuning. Chat Completions allows function calling only with reasoning off.",
    },
  ],
  faq: [
    {
      question: "Is \"Luna 6\" the same as GPT-6 Luna?",
      answer: "Yes. OpenAI's model is named GPT-6 Luna, with the API model ID gpt-6-luna. It is the smallest tier of the GPT-6 family, below GPT-6.1 Sol and GPT-6 Astra.",
    },
    {
      question: "Which one is cheaper?",
      answer: "For prompts up to 100K tokens the listed prices are identical: $0.10 input and $0.50 output per million tokens. Between 100K and 272K tokens GPT-6 Luna is much cheaper, because Haiku 5.5 moves to $0.50 and $2.50. Anthropic also notes that Haiku 5.5's updated tokenizer uses slightly more tokens per task, so compare costs on your own prompts.",
    },
    {
      question: "Is there a free tier?",
      answer: "Not on either API: both bill API usage per token, and GPT-6 Luna is not available on the OpenAI API's Free usage tier. Claude.ai Free users can select Haiku 5.5 in the Claude app on web, iOS and Android, though Anthropic does not state the usage limits there.",
    },
    {
      question: "Which is better for coding agents?",
      answer: "Neither vendor positions its smallest model for complex agentic coding. Anthropic suggests Haiku 5.5 as a subagent alongside Sonnet 5.5 or Opus 5.5, and OpenAI points complex reasoning and coding to GPT-6 Astra. Use either for narrowly scoped steps rather than the lead agent.",
    },
    {
      question: "Did you benchmark the two models against each other?",
      answer: "No. Anthropic and OpenAI publish results on different benchmarks, and we did not run a shared test. This comparison uses each vendor's official documentation and pricing.",
    },
  ],
};
