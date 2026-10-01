import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AgentCard } from "@/components/agents/agent-card";
import { AgentsTable } from "@/components/agents/agents-table";
import { Breadcrumb } from "@/components/agents/breadcrumb";
import { Checked } from "@/components/agents/checked";
import { Faq } from "@/components/agents/faq";
import { JsonLd } from "@/components/agents/json-ld";
import { Sources } from "@/components/agents/sources";
import { displayName, getAgent } from "@/lib/agents/data";
import { BEST_PAGES } from "@/lib/agents/content";
import { absoluteUrl, CHECKED_ON } from "@/lib/agents/site";

export const generateStaticParams = () => Object.keys(BEST_PAGES).map((topic) => ({ topic }));

type Props = { params: Promise<{ topic: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  if (!BEST_PAGES[topic]) notFound();
  const { meta } = await BEST_PAGES[topic]();
  return { title: { absolute: meta.title }, description: meta.description, alternates: { canonical: `/agents/best/${topic}` } };
}

export default async function BestPage({ params }: Props) {
  const { topic } = await params;
  const load = BEST_PAGES[topic];
  if (!load) notFound();
  const { default: Body, meta } = await load();
  const entries = meta.entries.map((e) => ({ ...e, agent: getAgent(e.slug) }));
  const sources = [...new Set(entries.flatMap((e) => e.agent.sources))];

  return (
    <main>
      <section className="border-b border-line">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 pt-8 pb-10 md:px-10 md:pt-10">
          <Breadcrumb items={[{ href: "/agents", label: "AI agents" }, { href: `/agents/best/${topic}`, label: meta.heading }]} />
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="flex flex-col gap-4">
              <h1 className="font-serif text-[40px] leading-[1.05] font-medium tracking-[-0.02em] md:text-[56px]">{meta.heading}</h1>
              <p className="max-w-[760px] text-[17px] leading-normal text-ink-2 md:text-[19px]">{meta.intro}</p>
            </div>
            <Checked on={CHECKED_ON}>
              <div>{entries.length} picks · {sources.length} official sources</div>
            </Checked>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1080px] flex-col gap-14 px-4 pt-10 md:px-10">
        <section id="quick-picks" className="flex flex-col gap-5 rounded-[20px] bg-night p-6 text-on-night md:p-9">
          <div className="text-[13px] font-bold tracking-[0.08em] text-[#B9BCC6] uppercase">Quick picks</div>
          <div className="grid gap-4 md:grid-cols-2">
            {meta.quickPicks.map((q) => (
              <a key={q.label} href={`#${q.slug}`} className="flex flex-col gap-1.5 rounded-[14px] bg-night-2 p-5 text-on-night hover:text-on-night hover:no-underline">
                <span className="text-[13px] font-bold tracking-[0.06em] text-side-a-soft uppercase">{q.label}</span>
                <span className="font-serif text-[24px]">{displayName(getAgent(q.slug))}</span>
                <span className="text-[15px] leading-normal opacity-85">{q.why}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-[30px] font-medium md:text-[36px]">At a glance</h2>
          <AgentsTable agents={entries.map((e) => e.agent)} />
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="font-serif text-[30px] font-medium md:text-[36px]">The picks</h2>
          {entries.map((e, i) => (
            <AgentCard key={e.slug} agent={e.agent} rank={i + 1}>
              <p>{e.summary}</p>
              <p>
                <strong className="text-ink">Pick it if:</strong> {e.pickIf}
              </p>
            </AgentCard>
          ))}
        </section>

        <article className="prose-av">
          <Body />
        </article>

        <p className="text-[15px] text-muted">
          How we pick and check: <Link href="/agents/methodology">methodology</Link>. Nobody paid to be on this list.
        </p>

        <Faq items={meta.faq} />
        <Sources urls={sources} />
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: meta.title,
          url: absoluteUrl(`/agents/best/${topic}`),
          itemListElement: entries.map((e, i) => ({ "@type": "ListItem", position: i + 1, name: displayName(e.agent), url: e.agent.official_url })),
        }}
      />
    </main>
  );
}
