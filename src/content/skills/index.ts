// Registry of the /skills pages: one entry per MDX file in skills/.
// src/lib/skills/skills.test.ts checks that files, entries and skills.json match.
// Pages the maintainer asks for are published directly (AGENTS.md); others start as "draft".

import type { SkillsRegistry } from "@/lib/skills/types";

export const REGISTRY: SkillsRegistry = {
  overview: () => import("./overview.mdx"),
  skills: {
    "fable-video-maker": { status: "published", load: () => import("./skills/fable-video-maker.mdx") },
    cinetic: { status: "published", load: () => import("./skills/cinetic.mdx") },
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
    "day-trader-skill": { status: "published", load: () => import("./skills/day-trader-skill.mdx") },
    "code-animation-prompts": { status: "published", load: () => import("./skills/code-animation-prompts.mdx") },
    reanimate: { status: "published", load: () => import("./skills/reanimate.mdx") },
    teardown: { status: "published", load: () => import("./skills/teardown.mdx") },
    "watermarks-remover": { status: "published", load: () => import("./skills/watermarks-remover.mdx") },
    "refactor-codebase": { status: "published", load: () => import("./skills/refactor-codebase.mdx") },
    "stickman-video-director": { status: "published", load: () => import("./skills/stickman-video-director.mdx") },
  },
};
