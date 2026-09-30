import type { ComponentType } from "react";

// Shapes of the pages synced from agentsversus into src/content/agents/.
// Each MDX file exports `meta` plus an MDX body; the generated index registers them.

export type FaqItem = { q: string; a: string };

export type CompareMeta = {
  title: string;
  description: string;
  subtitle: string;
  verdict: string;
  /** One "Pick X if" list per side, in the same order as the registry's `sides`. */
  picks: string[][];
  faq: FaqItem[];
};

export type AgentMeta = {
  title: string;
  description: string;
  summary: string;
  bestFor: string[];
  notFor: string[];
  faq: FaqItem[];
};

export type PricingMeta = {
  title: string;
  description: string;
  answer: string;
  faq: FaqItem[];
};

export type AlternativesMeta = {
  title: string;
  description: string;
  intro: string;
  /** Why people look elsewhere; each reason maps to the alternatives that answer it. */
  reasons: { reason: string; picks: string[] }[];
  /** One entry per alternative, in ranking order. */
  entries: { slug: string; why: string; tradeoff: string }[];
  faq: FaqItem[];
};

export type BestMeta = {
  title: string;
  description: string;
  heading: string;
  intro: string;
  quickPicks: { label: string; slug: string; why: string }[];
  entries: { slug: string; summary: string; pickIf: string }[];
  faq: FaqItem[];
};

/** Copy for the /agents overview: "Most compared" cards, agent-vs-chatbot table and FAQ. */
export type HubMeta = {
  title: string;
  description: string;
  cards: { href: string; title: string; note: string }[];
  kinds: { row: string; chatbot: string; agent: string }[];
  faq: FaqItem[];
};

export type Mod<M> = { default: ComponentType; meta: M };
type Load<M> = () => Promise<Mod<M>>;

export type AgentsRegistry = {
  hub: Load<HubMeta>;
  /** `kind: "assistant"` compares general chatbots and uses the chatbot spec rows. */
  comparisons: Record<string, { sides: string[]; kind: "agent" | "assistant"; load: Load<CompareMeta> }>;
  agentPages: Record<string, Load<AgentMeta>>;
  /** `planPrefix` names plans as buyers see them ("ChatGPT Pro", "Muse Power"). */
  pricingPages: Record<string, { planPrefix: string; compareWith: string[]; load: Load<PricingMeta> }>;
  alternativesPages: Record<string, Load<AlternativesMeta>>;
  bestPages: Record<string, Load<BestMeta>>;
};
