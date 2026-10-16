import type { AlternativesPage } from "@/lib/editorial/types";

export const cursorAlternatives: AlternativesPage = {
  kind: "alternatives",
  slug: "cursor",
  title: "Cursor alternatives after its move to The X Subscription",
  description: "Cursor's $8 plan now runs only Grok models. Six coding-agent alternatives compared on model choice, pricing, platforms and how they run.",
  author: "Ordalin",
  publishedAt: "2026-10-16",
  status: "published",
  groupSlug: "coding",
  anchorSlug: "cursor",
  intro: [
    "Since October 12, 2026, new Cursor plans are sold as part of The X Subscription, which bundles Grok, Grok Bot, Cursor and X Premium with one weekly usage pool. The $8 Plus plan runs only Cursor's own Grok and Composer models. Claude, GPT and Gemini are not included in any plan's pool: from the $30 Premium plan up, they are paid at API list price from prepaid credit. Existing Pro, Pro+, Ultra, Start and Teams subscribers can keep their legacy plans.",
    "If you want a coding agent where the model choice and the bill stay in your hands, the tools below each take a different route: open source with any provider, a terminal with usage included, an editor that drives the agent subscriptions you already pay for, or a cheap subscription to another frontier model. The comparisons come from each vendor's official pages, checked on the dates shown, not from running the same task in every tool.",
  ],
  whySwitch: [
    "You want Claude, GPT or Gemini in your plan. Cursor's Plus plan runs only Grok and Composer models, and on higher plans third-party models are paid at API list price from prepaid credit.",
    "You want to use your own API keys on a low-cost plan. Plus excludes your own keys, as well as Auto, Cloud Agents and Bugbot.",
    "You don't want coding usage to compete with chat. Each paid plan has one weekly pool shared with Grok Chat, Imagine, Voice and Grok Bot.",
  ],
  picks: [
    {
      toolSlug: "opencode",
      label: "Best open-source replacement with any model",
      bestFor: "Developers who want an agent in the terminal, desktop or IDE that works with whichever models they already pay for, including a GitHub Copilot or ChatGPT Plus/Pro login.",
      notIdealIf: "You need a shared team subscription below Enterprise, or you work on Windows without WSL.",
      summary: [
        "OpenCode is a free, open-source coding agent with a terminal interface, desktop app and IDE extension. It connects to models from 75+ providers, including local models, and has Plan and Build modes, undo and redo, AGENTS.md project context and parallel sessions on one project.",
        "The agent itself costs nothing and includes free models. If you would rather not manage keys, the same team sells Zen, pay-as-you-go access to models tested for coding agents, and Go, a curated set of open models for $10 a month ($40 for Go Plus). Go workspaces are single-member only.",
      ],
    },
    {
      toolSlug: "warp",
      label: "Best for terminal-first work with usage included",
      bestFor: "Developers who live in the terminal and want a plan that includes a monthly amount of agent usage across several model providers.",
      notIdealIf: "You want a traditional code editor, or you run heavy agent workloads and want a fixed bill.",
      summary: [
        "Warp is an agentic development environment built around a terminal, with apps for macOS, Windows and Linux; the terminal is open source. It works with models from OpenAI, Anthropic, z.ai and others, and connects to Slack, Linear and GitHub.",
        "The Build plan costs $20 a month ($18 billed annually) and includes $20 of agent usage at API rates each month; Max at $200 includes ten times that. Usage beyond the included amount is charged on top, with spend caps available. A free plan is available.",
      ],
    },
    {
      toolSlug: "singularity",
      label: "Best editor that drives your existing agent subscriptions",
      bestFor: "Developers who already pay for Claude, Codex, GitHub Copilot or Gemini and want a full IDE that runs those agents on tickets in parallel.",
      notIdealIf: "You want models bundled with the editor, or you need a finished product rather than a beta.",
      summary: [
        "Singularity is a desktop IDE with a code editor, terminals and a Git cockpit, built around tickets: you describe a feature, bug or refactor, an agent works on it in an isolated worktree, and you review and approve the merge. It drives each provider's own CLI, so the models are the ones your accounts already include.",
        "The app is free with unlimited agents, projects and worktrees on macOS, Windows and Linux. An optional €24-a-month licence per workstation unlocks paid plugins such as Pipelines. It is still in beta, and projects and tickets live in a local database you need to back up.",
      ],
    },
    {
      toolSlug: "muse-wonder",
      label: "Cheapest subscription to a frontier coding model",
      bestFor: "Developers who want a terminal coding agent on a $5-a-month plan, or long-context work with a 1,048,576-token window.",
      notIdealIf: "You want an editor rather than a terminal agent, or you don't want your usage to train the model by default.",
      summary: [
        "Muse Wonder is Meta's model for software engineering and long-running agents, used through the Muse Code terminal agent or Meta's Model API. It makes and verifies changes across files, delegates to sub-agents, accepts images, video, audio and PDFs, and can operate browser, desktop and mobile interfaces.",
        "Muse Code plans run from $5 a month (10 to 50 prompts every five hours) to $200, and the larger Wonder Full variant needs the $50 or $200 plan. Subscriptions default to Contributor mode, which gives more usage in exchange for training permission; you can turn it off. Meta labels Muse Wonder as a preview.",
      ],
    },
    {
      toolSlug: "codeaf",
      label: "Best free agent for parallel, checked tasks",
      bestFor: "Developers who want to hand off larger jobs that split into parallel tasks, each on its own branch and checked before merging, using their own model provider or a Codex plan.",
      notIdealIf: "You want a hosted model or an editor interface.",
      summary: [
        "CodeAF splits a request into tasks, runs each on its own branch in its own copy of the repo, and merges only what passes an independent check. Each task gets a worker, planner and checker, and each can run on a different model chosen for cost and quality. Claude Code or Codex can also call it headlessly.",
        "It is free and open source under Apache-2.0, with one binary for macOS, Linux and Windows. You pay the model provider you connect, or route work through a Codex plan, and built-in limits pause runaway spending. Telemetry is on by default and can be switched off.",
      ],
    },
    {
      toolSlug: "hypervibe",
      label: "Best for running several agent CLIs side by side on a Mac",
      bestFor: "Mac developers who already use Claude Code, Codex, Gemini CLI or Grok and want to run several of them at once on one board.",
      notIdealIf: "You use Intel, Windows or Linux, want a free plan, or need the app to supply the models.",
      summary: [
        "Hypervibe is a native macOS app that runs each agent as its real interactive CLI in its own terminal console, laid out on a pannable board. It supports 34 agent CLIs, adds a map of which agent is working or waiting, team handoffs, scheduled loops and session resume, and runs everything on the subscriptions you already hold.",
        "It costs $19 a month or $190 a year, with no free plan or trial, and needs an Apple Silicon Mac on macOS 14 or later. It does not isolate files itself, so agents working in one repo need separate git worktrees.",
      ],
    },
  ],
  decisionGuide: [
    { situation: "I want a free, open-source agent that works with any model provider", toolSlug: "opencode" },
    { situation: "I want to reuse my GitHub Copilot or ChatGPT Plus login for coding", toolSlug: "opencode" },
    { situation: "I work mostly in the terminal and want agent usage included in my plan", toolSlug: "warp" },
    { situation: "I want a full IDE that runs my existing Claude, Codex or Copilot agents in parallel", toolSlug: "singularity" },
    { situation: "I want the cheapest monthly plan with a frontier coding model", toolSlug: "muse-wonder" },
    { situation: "I want large jobs split into parallel tasks that are checked before merging", toolSlug: "codeaf" },
    { situation: "I run several agent CLIs on a Mac and want them on one board", toolSlug: "hypervibe" },
  ],
  faq: [
    {
      question: "Can I still use Claude or GPT in Cursor?",
      answer: "Yes, but not on the $8 Plus plan, which runs only Cursor's Grok and Composer models. From the $30 Premium plan up, Claude, GPT and Gemini are paid at API list price from prepaid credit rather than from the included weekly pool. Existing subscribers on legacy Pro, Pro+, Ultra, Start or Teams plans can keep them.",
    },
    {
      question: "What is the closest free alternative to Cursor?",
      answer: "OpenCode is free and open source, includes free models and works with 75+ providers, with a desktop app and IDE extension as well as the terminal. Singularity is a free desktop IDE if you already have Claude, Codex, Copilot or Gemini accounts. Warp has a free plan, with extra agent usage charged at pay-as-you-go rates.",
    },
    {
      question: "Which alternative works with the subscriptions I already pay for?",
      answer: "Singularity and Hypervibe both drive each provider's own CLI, so they use the Claude, Codex, Copilot, Gemini or other accounts you already have. OpenCode can sign in with GitHub Copilot or ChatGPT Plus/Pro, and CodeAF can route work through a Codex plan.",
    },
    {
      question: "Is there a cheaper subscription than Cursor's plans?",
      answer: "Muse Code starts at $5 a month with Meta's Muse Wonder model, and OpenCode Go costs $10 a month for a curated set of open coding models. Both have usage limits per time window; check each tool's profile for the current allowances.",
    },
    {
      question: "Did you test these tools hands-on?",
      answer: "No. This guide is based on each vendor's official pages, documentation and pricing, checked on the dates shown on each tool's profile.",
    },
  ],
};
