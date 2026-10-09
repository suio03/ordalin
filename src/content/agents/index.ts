// Registry of the /agents pages: one entry per MDX file in this folder.
// src/lib/agents/agents.test.ts checks that files and entries match.

import type { AgentsRegistry } from "@/lib/agents/content-types";

export const REGISTRY: AgentsRegistry = {
  overview: () => import("./overview.mdx"),
  hubs: {
    "personal": () => import("./personal.mdx"),
  },
  comparisons: {
    "muse-vs-dots": { sides: ["meta-muse","chatgpt-dots"], load: () => import("./compare/muse-vs-dots.mdx") },
    "muse-vs-dots-vs-grok-bot": { sides: ["meta-muse","chatgpt-dots","grok-bot"], load: () => import("./compare/muse-vs-dots-vs-grok-bot.mdx") },
    "muse-vs-dots-vs-gemini-spark": { sides: ["meta-muse","chatgpt-dots","gemini-spark"], load: () => import("./compare/muse-vs-dots-vs-gemini-spark.mdx") },
  },
  agentPages: {
    "airtap": () => import("./agents/airtap.mdx"),
    "hark-pro": () => import("./agents/hark-pro.mdx"),
    "meta-muse": () => import("./agents/meta-muse.mdx"),
    "chatgpt-dots": () => import("./agents/chatgpt-dots.mdx"),
    "grok-bot": () => import("./agents/grok-bot.mdx"),
  },
  pricingPages: {
    "meta-muse": { planPrefix: "Muse", compareWith: ["chatgpt-dots","gemini-spark","grok-bot","poke","lindy"], load: () => import("./pricing/meta-muse.mdx") },
    "chatgpt-dots": { planPrefix: "ChatGPT", compareWith: ["meta-muse","gemini-spark","grok-bot","lindy","poke"], load: () => import("./pricing/chatgpt-dots.mdx") },
  },
  alternativesPages: {
    "openclaw": () => import("./alternatives/openclaw.mdx"),
  },
  bestPages: {
    "ai-personal-assistants": () => import("./best/ai-personal-assistants.mdx"),
  },
  safetyPages: {
    "meta-muse": () => import("./safety/meta-muse.mdx"),
  },
};
