import Link from "next/link";
import type { ReactNode } from "react";
import { capitalize, cheapestPlan, displayName, formatPrice, NOT_STATED, platformList, stated, vendorShort, type Agent } from "@/lib/agents/data";
import { agentHref } from "@/lib/agents/content";
import { outbound } from "@/lib/agents/site";

/** One agent's key official facts plus an editorial slot. Used on alternatives and best-of pages. */
export function AgentCard({ agent, rank, children }: { agent: Agent; rank?: number; children?: ReactNode }) {
  const link = agentHref(agent.slug, agent.official_url);
  const cheapest = cheapestPlan(agent);
  const where = [...platformList(agent), ...(agent.messaging ?? [])];
  const facts: [string, string][] = [
    ["Free tier", capitalize(stated(agent.access?.free_tier))],
    ["Cheapest paid plan", cheapest ? `${cheapest.name}: ${formatPrice(cheapest)}` : NOT_STATED],
    ["Where you use it", where.join(", ") || NOT_STATED],
    ["How it runs", stated(agent.execution)],
    ["Availability", stated(agent.regions)],
  ];
  return (
    <section id={agent.slug} className="flex scroll-mt-6 flex-col gap-4 rounded-2xl border border-line bg-surface p-6 md:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="font-serif text-[26px] font-medium md:text-[30px]">
          {rank != null && <span className="mr-2 font-mono text-[18px] text-muted">{rank}.</span>}
          {link.internal ? <Link href={link.href} className="text-ink">{displayName(agent)}</Link> : displayName(agent)}
        </h3>
        <span className="text-[14px] text-muted">
          {vendorShort(agent)} · {capitalize(agent.category)}
        </span>
      </div>
      {children && <div className="flex flex-col gap-3 text-[16px] leading-relaxed text-ink-2">{children}</div>}
      <dl className="grid gap-x-6 gap-y-2 border-t border-line-soft pt-4 text-[15px] md:grid-cols-[180px_1fr]">
        {facts.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-semibold text-muted-2">{k}</dt>
            <dd className={v === NOT_STATED ? "text-muted" : ""}>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-4 text-[15px] font-semibold">
        {link.internal && <Link href={link.href}>Full profile →</Link>}
        <a href={outbound(agent.official_url)} rel="noopener">
          Official site ↗
        </a>
      </div>
    </section>
  );
}
