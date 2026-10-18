import type { ComponentType } from "react";
import type { FaqItem } from "@/lib/agents/content-types";

// Shapes of the agent skill pages in src/content/skills/.
// Facts live in skills.json; each MDX file exports `meta` (Ordalin's own test) plus an MDX body.

export type Skill = {
  slug: string;
  name: string;
  /** Name the skill shows once installed, when it differs from `name`. */
  display_name?: string;
  author: string;
  repo: string;
  license: string;
  version: string;
  /** Agents the repository names; "unknown" renders as "Not stated". */
  agents: string;
  install: string;
  /** Language the skill writes or works in. */
  language: string;
  produces: string;
  checked_on: string;
};

/** One sample from Ordalin's test run, shown verbatim. */
export type TestSample = { label: string; text: string; note?: string };

export type SkillTest = {
  date: string;
  agent: string;
  model: string;
  /** Repository commit the test used. */
  commit: string;
  task: string;
  samples: TestSample[];
};

export type SkillMeta = {
  title: string;
  description: string;
  summary: string;
  bestFor: string[];
  notFor: string[];
  test: SkillTest;
  faq: FaqItem[];
};

export type SkillsMeta = { title: string; description: string; heading: string; intro: string };

export type Mod<M> = { default: ComponentType; meta: M };

export type SkillEntry = { status: "draft" | "published"; load: () => Promise<Mod<SkillMeta>> };

export type SkillsRegistry = {
  overview: () => Promise<Mod<SkillsMeta>>;
  skills: Record<string, SkillEntry>;
};
