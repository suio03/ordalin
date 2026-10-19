import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/agents/breadcrumb";
import { Checked } from "@/components/agents/checked";
import { Faq } from "@/components/agents/faq";
import { Sources } from "@/components/agents/sources";
import { JsonLd } from "@/components/agents/json-ld";
import { CopyCode } from "@/components/skills/copy-code";
import { FilmGallery } from "@/components/skills/film-gallery";
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
              <p className="max-w-[760px] text-[17px] leading-normal text-ink-2 md:text-[19px]">{meta.summary}</p>
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
            <h2 className="font-serif text-[30px] font-medium md:text-[36px]">{meta.gallery.heading}</h2>
            {meta.gallery.intro && <p className="max-w-[760px] text-[17px] text-muted">{meta.gallery.intro}</p>}
            <FilmGallery items={meta.gallery.items} />
            <p className="text-[13px] text-muted">{meta.gallery.credit}</p>
          </section>
        )}

        {meta.howItWorks && (
          <section className="flex flex-col gap-5">
            <h2 className="font-serif text-[30px] font-medium md:text-[36px]">How it works</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {meta.howItWorks.map((part) => (
                <div key={part.title} className="rounded-2xl border border-line bg-surface p-6 shadow-card">
                  <h3 className="mb-2 font-bold">{part.title}</h3>
                  <p className="text-[15px] leading-relaxed text-ink-2">{part.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {meta.quickstart && (
          <section className="flex flex-col gap-5">
            <h2 className="font-serif text-[30px] font-medium md:text-[36px]">Try it</h2>
            <ol className="flex flex-col gap-6">
              {meta.quickstart.map((step, i) => (
                <li key={step.label} className="flex flex-col gap-2">
                  <span className="font-bold">
                    {i + 1}. {step.label}
                  </span>
                  <CopyCode code={step.code} />
                  {step.note && <p className="text-[14px] text-muted">{step.note}</p>}
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="mb-3 text-[13px] font-bold tracking-[0.06em] text-ok uppercase">Best for</h2>
            <ul className="flex flex-col gap-2 text-[16px]">{meta.bestFor.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="mb-3 text-[13px] font-bold tracking-[0.06em] text-muted uppercase">Not the best fit for</h2>
            <ul className="flex flex-col gap-2 text-[16px]">{meta.notFor.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="font-serif text-[30px] font-medium md:text-[36px]">Key facts</h2>
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
          <h2 className="font-serif text-[30px] font-medium md:text-[36px]">Our test</h2>
          <div className="font-mono text-[13px] text-muted-2">
            {test.date} · {test.agent} · {test.model} · repository commit {test.commit}
          </div>
          <div className="rounded-2xl bg-surface-2 p-5 text-[15px]">
            <div className="mb-1 text-[13px] font-bold tracking-[0.06em] text-muted uppercase">Request</div>
            <p className="whitespace-pre-line">{test.task}</p>
          </div>
          {test.samples.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-3">
              {test.samples.map((sample) => (
                <figure key={sample.label} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-card">
                  <figcaption className="flex flex-col gap-1">
                    <span className="font-bold">{sample.label}</span>
                    {sample.note && <span className="text-[13px] text-muted">{sample.note}</span>}
                  </figcaption>
                  <p className="text-[15px] leading-relaxed whitespace-pre-line">{sample.text}</p>
                </figure>
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
