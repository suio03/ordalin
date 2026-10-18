import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import Link from "next/link";
import { displayName, getSkill, HUB_INDEX_MINIMUM, OVERVIEW, publishedSkillSlugs, skillsPath, visibleSkillSlugs } from "@/lib/skills/data";

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await OVERVIEW();
  return withSocial({
    title: { absolute: meta.title },
    description: meta.description,
    alternates: { canonical: skillsPath.overview },
    robots: publishedSkillSlugs().length >= HUB_INDEX_MINIMUM ? undefined : { index: false, follow: true },
  });
}

export default async function SkillsOverviewPage() {
  const { meta } = await OVERVIEW();
  const skills = visibleSkillSlugs().map(getSkill);

  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-16 px-4 pt-12 md:px-10 md:pt-16">
      <section className="flex max-w-[880px] flex-col gap-5">
        <h1 className="font-serif text-[40px] leading-[1.05] font-medium tracking-[-0.02em] md:text-[60px]">{meta.heading}</h1>
        <p className="text-[18px] leading-normal text-ink-2 md:text-[20px]">{meta.intro}</p>
        <div className="font-mono text-[13px] text-muted-2">{skills.length} skills tested</div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {skills.map((skill) => (
          <Link key={skill.slug} href={skillsPath.skill(skill.slug)} className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-5 text-ink hover:no-underline">
            <span className="font-bold">{displayName(skill)}</span>
            <span className="text-[14px] text-muted">{skill.produces}</span>
            <span className="text-[13px] text-muted-2">
              {skill.author} · {skill.language} · {skill.license}
            </span>
          </Link>
        ))}
      </section>

      <p className="text-[14px] text-muted">
        Independent. Not affiliated with, endorsed by, or paid by any skill author. We link to each repository and do not copy its files.
      </p>
    </main>
  );
}
