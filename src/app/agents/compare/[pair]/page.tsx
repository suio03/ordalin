import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/agents/breadcrumb";
import { Checked } from "@/components/agents/checked";
import { Faq } from "@/components/agents/faq";
import { JsonLd } from "@/components/agents/json-ld";
import { Sources } from "@/components/agents/sources";
import { SpecTable } from "@/components/agents/spec-table";
import { displayName, getAgent, vendorShort } from "@/lib/agents/data";
import { agentHref, ALTERNATIVES_PAGES, COMPARISONS, PRICING_PAGES } from "@/lib/agents/content";
import { SIDES } from "@/lib/agents/sides";
import { absoluteUrl, CHECKED_ON, outbound } from "@/lib/agents/site";
import { assistantSpecRows, NOT_STATED_NOTE, specRows } from "@/lib/agents/specs";

export const generateStaticParams = () => Object.keys(COMPARISONS).map((pair) => ({ pair }));

type Props = { params: Promise<{ pair: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pair } = await params;
  if (!COMPARISONS[pair]) notFound();
  const { meta } = await COMPARISONS[pair].load();
  return { title: { absolute: meta.title }, description: meta.description, alternates: { canonical: `/agents/compare/${pair}` } };
}

type Card = { href: string; title: string; note: string; external?: string };

export default async function ComparePage({ params }: Props) {
  const { pair } = await params;
  const entry = COMPARISONS[pair];
  if (!entry) notFound();
  const { default: Body, meta } = await entry.load();
  const agents = entry.sides.map(getAgent);
  const names = agents.map(displayName);
  const sources = [...new Set(agents.flatMap((a) => a.sources))];
  const isAssistant = entry.kind === "assistant";
  const three = agents.length > 2;

  // Next reads: each side's own page, related comparisons, then pricing and alternatives pages.
  const cards: Card[] = [
    ...agents.map((a) => {
      const link = agentHref(a.slug, a.official_url);
      return link.internal
        ? { href: link.href, title: displayName(a), note: "What it is, pricing, and what it can do →" }
        : { href: link.href, title: displayName(a), note: `Official site (${vendorShort(a)}) ↗`, external: a.slug };
    }),
    ...Object.entries(COMPARISONS)
      .filter(([p, c]) => p !== pair && c.sides.some((s) => entry.sides.includes(s)))
      .map(([p, c]) => ({ href: `/agents/compare/${p}`, title: c.sides.map((s) => displayName(getAgent(s))).join(" vs "), note: "Side-by-side comparison →" })),
    ...entry.sides.filter((s) => s in PRICING_PAGES).map((s) => ({ href: `/agents/pricing/${s}`, title: `${displayName(getAgent(s))} pricing`, note: "Which plan you need →" })),
    ...entry.sides
      .filter((s) => s in ALTERNATIVES_PAGES)
      .map((s) => ({ href: `/agents/alternatives/${s}`, title: `${displayName(getAgent(s))} alternatives`, note: "What else to consider →" })),
  ];

  return (
    <main>
      <section className="border-b border-line">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 pt-8 pb-10 md:px-10 md:pt-10">
          <Breadcrumb items={[...(isAssistant ? [] : [{ href: "/agents", label: "AI agents" }]), { href: `/agents/compare/${pair}`, label: names.join(" vs ") }]} />
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="flex flex-col gap-4">
              <h1 className={`font-serif leading-[1.02] font-medium tracking-[-0.02em] ${three ? "text-[36px] md:text-[54px]" : "text-[42px] md:text-[64px]"}`}>
                {names.map((n, i) => (
                  <span key={n}>
                    {i > 0 && <span className="text-muted italic"> vs </span>}
                    <span className={SIDES[i].text}>{n}</span>
                  </span>
                ))}
              </h1>
              <p className="max-w-[760px] text-[17px] leading-normal text-ink-2 md:text-[19px]">{meta.subtitle}</p>
            </div>
            <Checked on={CHECKED_ON}>
              <div>{sources.length} official sources</div>
            </Checked>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1080px] flex-col gap-14 px-4 pt-10 md:px-10">
        <section id="verdict" className="flex flex-col gap-6 rounded-[20px] bg-night p-6 text-on-night md:p-9">
          <div className="text-[13px] font-bold tracking-[0.08em] text-[#B9BCC6] uppercase">Quick verdict</div>
          <p className="font-serif text-[24px] leading-[1.25] md:text-[30px]">{meta.verdict}</p>
          <div className={`grid gap-4 ${three ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            {names.map((name, i) => (
              <div key={name} className={`flex flex-col gap-2.5 rounded-[14px] p-5 ${SIDES[i].bg}`}>
                <div className={`text-[13px] font-bold tracking-[0.06em] uppercase ${SIDES[i].soft}`}>Pick {name} if</div>
                <ul className="flex flex-col gap-2.5">
                  {meta.picks[i].map((p) => (
                    <li key={p} className="text-[16px] leading-normal">{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section id="specs" className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-[30px] font-medium md:text-[36px]">Specs side by side</h2>
            <span className="inline-flex h-[30px] items-center gap-1.5 rounded-full border border-ink bg-surface px-3 text-[13px] font-semibold">Official sources only</span>
          </div>
          <SpecTable
            heads={agents.map((a, i) => ({ name: names[i], color: SIDES[i].color, initial: a.name[0].toUpperCase() }))}
            rows={isAssistant ? assistantSpecRows(agents) : specRows(agents)}
            footnote={NOT_STATED_NOTE}
          />
        </section>

        <article className="prose-av">
          <Body />
        </article>

        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-[30px] font-medium md:text-[36px]">Keep comparing</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {cards.map((c) =>
              c.external ? (
                <a key={c.href} href={outbound(c.href)} rel="noopener" className="rounded-2xl border border-line bg-surface p-5 text-ink hover:no-underline">
                  <div className="font-bold">{c.title}</div>
                  <div className="text-[14px] text-muted">{c.note}</div>
                </a>
              ) : (
                <Link key={c.href} href={c.href} className="rounded-2xl border border-line bg-surface p-5 text-ink hover:no-underline">
                  <div className="font-bold">{c.title}</div>
                  <div className="text-[14px] text-muted">{c.note}</div>
                </Link>
              ),
            )}
          </div>
        </section>

        <Faq items={meta.faq} />
        <Sources urls={sources} />
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: meta.title,
          url: absoluteUrl(`/agents/compare/${pair}`),
          dateModified: CHECKED_ON,
          about: agents.map((a) => ({
            "@type": "SoftwareApplication",
            name: displayName(a),
            applicationCategory: "BusinessApplication",
            url: a.official_url,
            author: { "@type": "Organization", name: vendorShort(a) },
          })),
        }}
      />
    </main>
  );
}
