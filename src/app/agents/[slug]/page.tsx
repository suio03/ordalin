import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/agents/breadcrumb";
import { Checked } from "@/components/agents/checked";
import { Faq } from "@/components/agents/faq";
import { JsonLd } from "@/components/agents/json-ld";
import { Sources } from "@/components/agents/sources";
import { SpecTable } from "@/components/agents/spec-table";
import { displayName, getAgent } from "@/lib/agents/data";
import { AGENT_PAGES, ALTERNATIVES_PAGES, comparisonsWith, PRICING_PAGES } from "@/lib/agents/content";
import { absoluteUrl, CHECKED_ON, outbound } from "@/lib/agents/site";
import { NOT_STATED_NOTE, specRows } from "@/lib/agents/specs";

export const generateStaticParams = () => Object.keys(AGENT_PAGES).map((slug) => ({ slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!AGENT_PAGES[slug]) notFound();
  const { meta } = await AGENT_PAGES[slug]();
  return withSocial({ title: { absolute: meta.title }, description: meta.description, alternates: { canonical: `/agents/${slug}` } });
}

export default async function AgentPage({ params }: Props) {
  const { slug } = await params;
  const load = AGENT_PAGES[slug];
  if (!load) notFound();
  const { meta } = await load();
  const agent = getAgent(slug);
  const name = displayName(agent);
  const comparisons = comparisonsWith(slug);

  return (
    <main>
      <section className="border-b border-line">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 pt-8 pb-10 md:px-10 md:pt-10">
          <Breadcrumb items={[{ href: "/agents", label: "AI agents" }, { href: `/agents/${slug}`, label: name }]} />
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="flex flex-col gap-4">
              <h1 className="font-serif text-[40px] leading-[1.05] font-medium tracking-[-0.02em] md:text-[56px]">{name}</h1>
              <p className="max-w-[760px] text-[17px] leading-normal text-ink-2 md:text-[19px]">{meta.summary}</p>
              <a href={outbound(agent.official_url)} rel="noopener" className="text-[15px] font-semibold">
                Official site ↗
              </a>
            </div>
            <Checked on={CHECKED_ON}>
              <div>{agent.sources.length} official sources</div>
            </Checked>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1080px] flex-col gap-14 px-4 pt-10 md:px-10">
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
          <SpecTable heads={[{ name, color: "var(--color-night)", initial: agent.name[0].toUpperCase() }]} rows={specRows([agent])} footnote={NOT_STATED_NOTE} />
        </section>

        {(comparisons.length > 0 || slug in PRICING_PAGES || slug in ALTERNATIVES_PAGES) && (
          <section className="flex flex-col gap-4">
            <h2 className="font-serif text-[30px] font-medium md:text-[36px]">Compare and price</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {comparisons.map(([pair, c]) => (
                <Link key={pair} href={`/agents/compare/${pair}`} className="rounded-2xl border border-line bg-surface p-5 font-bold text-ink hover:no-underline">
                  {c.sides.map((s) => displayName(getAgent(s))).join(" vs ")} →
                </Link>
              ))}
              {slug in PRICING_PAGES && (
                <Link href={`/agents/pricing/${slug}`} className="rounded-2xl border border-line bg-surface p-5 font-bold text-ink hover:no-underline">
                  {name} pricing →
                </Link>
              )}
              {slug in ALTERNATIVES_PAGES && (
                <Link href={`/agents/alternatives/${slug}`} className="rounded-2xl border border-line bg-surface p-5 font-bold text-ink hover:no-underline">
                  {name} alternatives →
                </Link>
              )}
            </div>
          </section>
        )}

        <Faq items={meta.faq} />
        <Sources urls={agent.sources} />
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name,
          url: agent.official_url,
          applicationCategory: "BusinessApplication",
          author: { "@type": "Organization", name: agent.vendor },
          mainEntityOfPage: absoluteUrl(`/agents/${slug}`),
        }}
      />
    </main>
  );
}
