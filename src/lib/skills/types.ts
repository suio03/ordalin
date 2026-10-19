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

/** A still the skill's author published, served from public/ under the author's licence. */
export type GalleryItem = {
  /** Section the item is listed under; consecutive items share a heading. */
  group?: string;
  src: string;
  label: string;
  title: string;
  caption: string;
  /** The author's own hosted film, played in place; never re-uploaded. */
  video?: string;
  /** Film length as m:ss. */
  duration?: string;
  /** What the author says the style suits. */
  uses?: string[];
};

export type Gallery = {
  heading: string;
  /** One or two sentences under the heading. */
  intro?: string;
  items: GalleryItem[];
  /** Attribution the licence asks for; the repository link itself sits at the bottom of the page. */
  credit: string;
};

/** A command or request the reader can copy, in the order they run it. */
export type QuickstartStep = { label: string; code: string; note?: string };

/** One part of how the skill works, in plain words. */
export type HowItWorksPart = { title: string; text: string };

export type SkillTest = {
  date: string;
  agent: string;
  model: string;
  /** Repository commit the test used. */
  commit: string;
  task: string;
  /** Text outputs shown side by side; empty when the output is a video or image we do not publish. */
  samples: TestSample[];
};

export type SkillMeta = {
  title: string;
  description: string;
  summary: string;
  bestFor: string[];
  notFor: string[];
  /** The author's own examples, for skills whose output is visual. */
  gallery?: Gallery;
  howItWorks?: HowItWorksPart[];
  quickstart?: QuickstartStep[];
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
