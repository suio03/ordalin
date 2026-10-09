import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import Link from "next/link";
import { allAgents, displayName, getAgent } from "@/lib/agents/data";
import { agentsPath, ALTERNATIVES_PAGES, BEST_PAGES, COMPARISONS, comparisonTitle, OVERVIEW, PRICING_PAGES } from "@/lib/agents/content";
import { CHECKED_ON } from "@/lib/agents/site";

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await OVERVIEW();
  return withSocial({ title: { absolute: meta.title }, description: meta.description, alternates: { canonical: agentsPath.overview } });
}

type LinkCard = { href: string; title: string; note: string };

function CardGrid({ cards }: { cards: LinkCard[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((c) => (
        <Link key={c.href} href={c.href} className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-5 text-ink hover:no-underline">
          <span className="font-bold">{c.title}</span>
          <span className="text-[14px] text-muted">{c.note}</span>
        </Link>
      ))}
    </div>
  );
}

export default async function AgentsOverviewPage() {
  const { meta } = await OVERVIEW();
  const agents = allAgents();
  const comparisons = Object.entries(COMPARISONS);

  const compareCards: LinkCard[] = comparisons.map(([pair, c]) => ({
    href: agentsPath.compare(pair),
    title: comparisonTitle(c.sides),
    note: "Price, features and privacy →",
  }));

  const bestCards = await Promise.all(
    Object.entries(BEST_PAGES).map(async ([topic, load]) => {
      const { meta: page } = await load();
      return { href: agentsPath.best(topic), title: page.heading, note: `${page.entries.length} picks →` };
    }),
  );
  const guideCards: LinkCard[] = [
    ...bestCards,
    ...Object.keys(ALTERNATIVES_PAGES).map((slug) => ({
      href: agentsPath.alternatives(slug),
      title: `${displayName(getAgent(slug))} alternatives`,
      note: "What to use instead →",
    })),
    ...Object.keys(PRICING_PAGES).map((slug) => ({
      href: agentsPath.pricing(slug),
      title: `${displayName(getAgent(slug))} pricing`,
      note: "Plans and what you need →",
    })),
  ];

  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-16 px-4 pt-12 md:px-10 md:pt-16">
      <section className="flex max-w-[880px] flex-col gap-5">
        <h1 className="font-serif text-[40px] leading-[1.05] font-medium tracking-[-0.02em] md:text-[60px]">{meta.heading}</h1>
        <p className="text-[18px] leading-normal text-ink-2 md:text-[20px]">{meta.intro}</p>
        <div className="font-mono text-[13px] text-muted-2">
          {agents.length} agents tracked · {comparisons.length} comparisons · baseline checked {CHECKED_ON} ·{" "}
          <Link href={agentsPath.methodology}>How we check</Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-[30px] font-medium md:text-[36px]">Browse by type</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {meta.categories.map((cat) => {
            const members = agents.filter((a) => a.channel === cat.channel);
            return (
              <Link key={cat.href} href={cat.href} className="flex flex-col gap-3 rounded-[20px] bg-night p-6 text-on-night hover:text-on-night hover:no-underline md:p-8">
                <span className="text-[13px] font-bold tracking-[0.08em] text-[#B9BCC6] uppercase">{members.length} agents</span>
                <span className="font-serif text-[30px] leading-tight md:text-[36px]">{cat.title}</span>
                <span className="text-[16px] opacity-85">{cat.blurb}</span>
                <span className="text-[14px] opacity-70">{members.map(displayName).join(" · ")}</span>
                <span className="text-side-a-soft">Compare them →</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-[30px] font-medium md:text-[36px]">Agent comparisons</h2>
        <CardGrid cards={compareCards} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-[30px] font-medium md:text-[36px]">Guides</h2>
        <CardGrid cards={guideCards} />
      </section>


      <p className="text-[14px] text-muted">
        Independent. Not affiliated with, endorsed by, or paid by any company whose product appears here. Product names are trademarks of their
        owners.
      </p>
    </main>
  );
}
