import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AgentCard } from "@/components/agents/agent-card";
import { Breadcrumb } from "@/components/agents/breadcrumb";
import { Checked } from "@/components/agents/checked";
import { Faq } from "@/components/agents/faq";
import { JsonLd } from "@/components/agents/json-ld";
import { Sources } from "@/components/agents/sources";
import { displayName, getAgent } from "@/lib/agents/data";
import { ALTERNATIVES_PAGES } from "@/lib/agents/content";
import { absoluteUrl, CHECKED_ON } from "@/lib/agents/site";

export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(ALTERNATIVES_PAGES).map((slug) => ({ slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { meta } = await ALTERNATIVES_PAGES[slug]();
  return { title: { absolute: meta.title }, description: meta.description, alternates: { canonical: `/agents/alternatives/${slug}` } };
}

export default async function AlternativesPage({ params }: Props) {
  const { slug } = await params;
  const load = ALTERNATIVES_PAGES[slug];
  if (!load) notFound();
  const { default: Body, meta } = await load();
  const agent = getAgent(slug);
  const name = displayName(agent);
  const entries = meta.entries.map((e) => ({ ...e, agent: getAgent(e.slug) }));
  const sources = [...new Set([agent, ...entries.map((e) => e.agent)].flatMap((a) => a.sources))];

  return (
    <main>
      <section className="border-b border-line">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 pt-8 pb-10 md:px-10 md:pt-10">
          <Breadcrumb items={[{ href: "/agents", label: "AI agents" }, { href: `/agents/alternatives/${slug}`, label: `${name} alternatives` }]} />
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="flex flex-col gap-4">
              <h1 className="font-serif text-[40px] leading-[1.05] font-medium tracking-[-0.02em] md:text-[56px]">{name} alternatives</h1>
              <p className="max-w-[760px] text-[17px] leading-normal text-ink-2 md:text-[19px]">{meta.intro}</p>
            </div>
            <Checked on={CHECKED_ON}>
              <div>{entries.length} alternatives · {sources.length} official sources</div>
            </Checked>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1080px] flex-col gap-14 px-4 pt-10 md:px-10">
        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-[30px] font-medium md:text-[36px]">Pick by what you want</h2>
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full min-w-[560px] text-left text-[15px]">
              <thead className="bg-surface-2 text-muted-2">
                <tr>
                  <th className="px-5 py-3 font-semibold">If you want…</th>
                  <th className="px-5 py-3 font-semibold">Look at</th>
                </tr>
              </thead>
              <tbody>
                {meta.reasons.map((r) => (
                  <tr key={r.reason} className="border-t border-line-soft align-top">
                    <td className="px-5 py-3">{r.reason}</td>
                    <td className="px-5 py-3 font-semibold">
                      {r.picks.map((p, i) => (
                        <span key={p}>
                          {i > 0 && ", "}
                          <a href={`#${p}`}>{displayName(getAgent(p))}</a>
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="font-serif text-[30px] font-medium md:text-[36px]">The alternatives</h2>
          {entries.map((e, i) => (
            <AgentCard key={e.slug} agent={e.agent} rank={i + 1}>
              <p>{e.why}</p>
              <p>
                <strong className="text-ink">Trade-off:</strong> {e.tradeoff}
              </p>
            </AgentCard>
          ))}
        </section>

        <article className="prose-av">
          <Body />
        </article>

        <p className="text-[15px] text-muted">
          How we pick and check: <Link href="/agents/methodology">methodology</Link>. Facts come from each maker&apos;s own pages; the ranking and trade-offs are our judgment.
        </p>

        <Faq items={meta.faq} />
        <Sources urls={sources} />
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: meta.title,
          url: absoluteUrl(`/agents/alternatives/${slug}`),
          itemListElement: entries.map((e, i) => ({ "@type": "ListItem", position: i + 1, name: displayName(e.agent), url: e.agent.official_url })),
        }}
      />
    </main>
  );
}
