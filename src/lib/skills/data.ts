import source from "@/content/skills/skills.json";
import { REGISTRY } from "@/content/skills";
import { editorialPreviewEnabled } from "@/lib/editorial";
import type { Skill } from "./types";

// Agent skill facts, edited in src/content/skills/skills.json and validated by skills.test.ts.
// Rule: only the skill's own repository or site fills a field; anything else stays "unknown".

export const NOT_STATED = "Not stated";
/** Three published pages before the hub is indexed and linked (MVP_PLAN.md, "Agent skills"). */
export const HUB_INDEX_MINIMUM = 3;

export const stated = (value: string | undefined) => (!value || value === "unknown" ? NOT_STATED : value);

export const allSkills = () => source.skills as Skill[];

export function getSkill(slug: string): Skill {
  const skill = allSkills().find((s) => s.slug === slug);
  if (!skill) throw new Error(`Unknown skill: ${slug}`);
  return skill;
}

export const displayName = (skill: Skill) => skill.display_name ?? skill.name;

export const OVERVIEW = REGISTRY.overview;

/** Drafts render locally for review; production serves only published pages. */
export const visibleSkillSlugs = () =>
  Object.entries(REGISTRY.skills)
    .filter(([, entry]) => entry.status === "published" || editorialPreviewEnabled())
    .map(([slug]) => slug);

export const publishedSkillSlugs = () =>
  Object.entries(REGISTRY.skills)
    .filter(([, entry]) => entry.status === "published")
    .map(([slug]) => slug);

export function loadSkillPage(slug: string) {
  const entry = REGISTRY.skills[slug];
  return entry && visibleSkillSlugs().includes(slug) ? entry.load() : null;
}

export const skillsPath = { overview: "/skills", skill: (slug: string) => `/skills/${slug}` };

/** Published /skills URLs, for the sitemap. The hub joins once it is indexable. */
export function allSkillsPaths() {
  const published = publishedSkillSlugs();
  return [...(published.length >= HUB_INDEX_MINIMUM ? [skillsPath.overview] : []), ...published.map(skillsPath.skill)];
}
