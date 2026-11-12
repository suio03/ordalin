import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/agents/breadcrumb";
import { Checked } from "@/components/agents/checked";
import { Faq } from "@/components/agents/faq";
import { Sources } from "@/components/agents/sources";
import { JsonLd } from "@/components/agents/json-ld";
import { FilmGallery } from "@/components/skills/film-gallery";
import { FitCards, HowItWorks, SampleCard, sectionHeading, Steps, TestRuns, TestShots } from "@/components/skills/test-parts";
import { absoluteUrl } from "@/lib/agents/site";
import { displayName, getSkill, loadSkillPage, NOT_STATED, skillsPath, stated, visibleSkillSlugs } from "@/lib/skills/data";
import type { Skill } from "@/lib/skills/types";

export const generateStaticParams = () => visibleSkillSlugs().map((slug) => ({ slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadSkillPage(slug);
  if (!page) notFound();
  return withSocial({ title: { absolute: page.meta.title }, description: page.meta.description, alternates: { canonical: skillsPath.skill(slug) } });
}

const factRows = (skill: Skill): [string, string][] => [
  ["Author", skill.author],
  ["Licence", stated(skill.license)],
  ["Version checked", stated(skill.version)],
  ["Works with", stated(skill.agents)],
  ["Language", stated(skill.language)],
  ["What it produces", stated(skill.produces)],
  ["Install", stated(skill.install)],
];

export default async function SkillPage({ params }: Props) {
  const { slug } = await params;
  const page = await loadSkillPage(slug);
  if (!page) notFound();
  const { default: Body, meta } = page;
  const skill = getSkill(slug);
  const name = displayName(skill);
  const { test } = meta;

  return (
    <main>
      <section className="border-b border-line">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 pt-8 pb-10 md:px-10 md:pt-10">
          <Breadcrumb items={[{ href: skillsPath.overview, label: "Agent skills" }, { href: skillsPath.skill(slug), label: name }]} />
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="flex flex-col gap-4">
              <h1 className="font-serif text-[40px] leading-[1.05] font-medium tracking-[-0.02em] md:text-[56px]">{name}</h1>
              <p className="max-w-[760px] text-[17px] leading-normal text-ink-2 md:text-[19px]">{meta.verdict ?? meta.summary}</p>
            </div>
            <Checked on={skill.checked_on}>
              <div>
                Tested {test.date} with {test.model}
              </div>
            </Checked>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1080px] flex-col gap-14 px-4 pt-10 md:px-10">
        {meta.gallery && (
          <section className="flex flex-col gap-5">
            <h2 className={sectionHeading}>{meta.gallery.heading}</h2>
            {meta.gallery.intro && <p className="max-w-[760px] text-[17px] text-muted">{meta.gallery.intro}</p>}
            <FilmGallery items={meta.gallery.items} />
            <p className="text-[13px] text-muted">{meta.gallery.credit}</p>
          </section>
        )}

        {(test.runs || test.shots) && (
          <section className="flex flex-col gap-5">
            <h2 className={sectionHeading}>What our test produced</h2>
            {test.runs && <TestRuns runs={test.runs} />}
            {test.shots && <TestShots shots={test.shots} />}
          </section>
        )}

        <FitCards bestFor={meta.bestFor} notFor={meta.notFor} />

        {meta.howItWorks && <HowItWorks parts={meta.howItWorks} />}

        {meta.quickstart && <Steps heading="Try it" steps={meta.quickstart} />}

        <section className="flex flex-col gap-3">
          <h2 className={sectionHeading}>Key facts</h2>
          <dl className="rounded-2xl border border-line bg-surface">
            {factRows(skill).map(([label, value]) => (
              <div key={label} className="grid gap-1 border-b border-line-soft px-5 py-4 text-[15px] last:border-b-0 md:grid-cols-[200px_1fr] md:text-[16px]">
                <dt className="font-semibold text-muted-2">{label}</dt>
                <dd className={value === NOT_STATED ? "text-muted" : ""}>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[13px] text-muted">From the skill&rsquo;s own repository. &ldquo;{NOT_STATED}&rdquo; means the repository does not say.</p>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className={sectionHeading}>Our test</h2>
          {meta.verdict && <p className="max-w-[760px] text-[17px] leading-relaxed text-muted-2">{meta.summary}</p>}
          <div className="font-mono text-[13px] text-muted-2">
            {test.date} · {test.agent} · {test.model} · repository commit {test.commit}
          </div>
          <div className="rounded-2xl bg-surface-2 p-5 text-[15px]">
            <div className="mb-1 text-[13px] font-bold tracking-[0.06em] text-muted uppercase">What we asked</div>
            <p className="whitespace-pre-line">{test.task}</p>
          </div>
          {test.samples.length > 0 && (
            <div className={`grid gap-4 ${test.samples.some((x) => x.mono) ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
              {test.samples.map((sample) => (
                <SampleCard key={sample.label} sample={sample} />
              ))}
            </div>
          )}
          <article className="prose-av">
            <Body />
          </article>
        </section>

        <Faq items={meta.faq} />
        <Sources title="Repository" urls={[skill.repo]} />
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareSourceCode",
          name,
          codeRepository: skill.repo,
          license: skill.license,
          mainEntityOfPage: absoluteUrl(skillsPath.skill(slug)),
        }}
      />
    </main>
  );
}
