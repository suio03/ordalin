// Registry of the /skills pages: one entry per MDX file in skills/.
// src/lib/skills/skills.test.ts checks that files, entries and skills.json match.
// Pages the maintainer asks for are published directly (AGENTS.md); others start as "draft".

import type { SkillsRegistry } from "@/lib/skills/types";

export const REGISTRY: SkillsRegistry = {
  overview: () => import("./overview.mdx"),
  skills: {
    "human-writing": { status: "published", load: () => import("./skills/human-writing.mdx") },
    "lemo-opuscar": { status: "published", load: () => import("./skills/lemo-opuscar.mdx") },
    humanizer: { status: "published", load: () => import("./skills/humanizer.mdx") },
    "replica-skill": { status: "published", load: () => import("./skills/replica-skill.mdx") },
    ponytail: { status: "published", load: () => import("./skills/ponytail.mdx") },
    impeccable: { status: "published", load: () => import("./skills/impeccable.mdx") },
    superpowers: { status: "published", load: () => import("./skills/superpowers.mdx") },
    "cloudflare-security-audit": { status: "published", load: () => import("./skills/cloudflare-security-audit.mdx") },
    "taste-skill": { status: "published", load: () => import("./skills/taste-skill.mdx") },
    "rea-video": { status: "published", load: () => import("./skills/rea-video.mdx") },
  },
};
