import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/agents/breadcrumb";
import { Checked } from "@/components/agents/checked";
import { Faq } from "@/components/agents/faq";
import { Sources } from "@/components/agents/sources";
import { SpecTable } from "@/components/agents/spec-table";
import { displayName, getAgent } from "@/lib/agents/data";
import { SAFETY_PAGES } from "@/lib/agents/content";
import { CHECKED_ON } from "@/lib/agents/site";
import { NOT_STATED_NOTE, specRows } from "@/lib/agents/specs";

export const generateStaticParams = () => Object.keys(SAFETY_PAGES).map((slug) => ({ slug }));

type Props = { params: Promise<{ slug: string }> };

/** Spec rows that answer "is it safe": how it runs, what it asks first, training. */
const SAFETY_ROWS = ["How it runs", "Asks before acting", "Training on your data", "Where you use it"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!SAFETY_PAGES[slug]) notFound();
  const { meta } = await SAFETY_PAGES[slug]();
  return withSocial({ title: { absolute: meta.title }, description: meta.description, alternates: { canonical: `/agents/safety/${slug}` } });
}

export default async function SafetyPage({ params }: Props) {
  const { slug } = await params;
  const load = SAFETY_PAGES[slug];
  if (!load) notFound();
  const { default: Body, meta } = await load();
  const agent = getAgent(slug);
  const name = displayName(agent);

  return (
    <main>
      <section className="border-b border-line">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 pt-8 pb-10 md:px-10 md:pt-10">
          <Breadcrumb items={[{ href: "/agents", label: "AI agents" }, { href: `/agents/${slug}`, label: name }, { href: `/agents/safety/${slug}`, label: "Safety" }]} />
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="flex flex-col gap-4">
              <h1 className="font-serif text-[40px] leading-[1.05] font-medium tracking-[-0.02em] md:text-[56px]">Is {name} safe?</h1>
              <p className="max-w-[760px] text-[17px] leading-normal text-ink-2 md:text-[19px]">{meta.answer}</p>
            </div>
            <Checked on={meta.checkedOn ?? CHECKED_ON} />
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1080px] flex-col gap-14 px-4 pt-10 md:px-10">
        <section className="flex flex-col gap-5">
          <h2 className="font-serif text-[30px] font-medium md:text-[36px]">Safety facts</h2>
          <SpecTable
            heads={[{ name, color: "var(--color-night)", initial: agent.name[0].toUpperCase() }]}
            rows={specRows([agent]).filter((r) => SAFETY_ROWS.includes(r.label))}
            footnote={NOT_STATED_NOTE}
          />
        </section>

        <article className="prose-av">
          <Body />
        </article>

        <Faq items={meta.faq} />
        <Sources urls={[...new Set([...agent.sources, ...meta.sources])]} />
      </div>
    </main>
  );
}
