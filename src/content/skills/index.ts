// Registry of the /skills pages: one entry per MDX file in skills/.
// src/lib/skills/skills.test.ts checks that files, entries and skills.json match.
// New pages start as "draft"; only the maintainer publishes them.

import type { SkillsRegistry } from "@/lib/skills/types";

export const REGISTRY: SkillsRegistry = {
  overview: () => import("./overview.mdx"),
  skills: {
    "human-writing": { status: "published", load: () => import("./skills/human-writing.mdx") },
  },
};
