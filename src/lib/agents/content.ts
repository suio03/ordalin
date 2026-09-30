import { REGISTRY } from "@/content/agents";
import { displayName, getAgent } from "./data";

// Pages synced from agentsversus. Every claim traces to a source in agents.json.

export const { hub: HUB, comparisons: COMPARISONS, agentPages: AGENT_PAGES, pricingPages: PRICING_PAGES, alternativesPages: ALTERNATIVES_PAGES, bestPages: BEST_PAGES } =
  REGISTRY;

/** All AI agent pages live under /agents, apart from Ordalin's own editorial /compare, /best and /alternatives. */
export const agentsPath = {
  hub: "/agents",
  methodology: "/agents/methodology",
  agent: (slug: string) => `/agents/${slug}`,
  compare: (pair: string) => `/agents/compare/${pair}`,
  pricing: (slug: string) => `/agents/pricing/${slug}`,
  alternatives: (slug: string) => `/agents/alternatives/${slug}`,
  best: (topic: string) => `/agents/best/${topic}`,
};

/** Internal URL for an agent if it has a page, else its official site. */
export function agentHref(slug: string, officialUrl: string): { href: string; internal: boolean } {
  return slug in AGENT_PAGES ? { href: agentsPath.agent(slug), internal: true } : { href: officialUrl, internal: false };
}

/** Comparisons that include this agent. */
export const comparisonsWith = (slug: string) => Object.entries(COMPARISONS).filter(([, c]) => c.sides.includes(slug));

export const comparisonTitle = (sides: string[]) => sides.map((s) => displayName(getAgent(s))).join(" vs ");

/** Every /agents URL, for the sitemap. */
export const allAgentsPaths = () => [
  agentsPath.hub,
  ...Object.keys(COMPARISONS).map(agentsPath.compare),
  ...Object.keys(AGENT_PAGES).map(agentsPath.agent),
  ...Object.keys(PRICING_PAGES).map(agentsPath.pricing),
  ...Object.keys(ALTERNATIVES_PAGES).map(agentsPath.alternatives),
  ...Object.keys(BEST_PAGES).map(agentsPath.best),
  agentsPath.methodology,
];
