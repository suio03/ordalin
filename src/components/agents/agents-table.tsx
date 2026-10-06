import Link from "next/link";
import { capitalize, cheapestPlan, displayName, formatPrice, stated, vendorShort, type Agent } from "@/lib/agents/data";
import { agentHref } from "@/lib/agents/content";
import { outbound } from "@/lib/agents/site";

/** Overview of every tracked agent. Internal link when we have a page, else the official site. */
export function AgentsTable({ agents }: { agents: Agent[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[720px] text-left text-[15px]">
        <thead className="bg-surface-2 text-muted-2">
          <tr>
            <th className="px-5 py-3 font-semibold">Agent</th>
            <th className="px-5 py-3 font-semibold">Maker</th>
            <th className="px-5 py-3 font-semibold">Type</th>
            <th className="px-5 py-3 font-semibold">Free tier</th>
            <th className="px-5 py-3 font-semibold">Cheapest paid plan</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((a) => {
            const link = agentHref(a.slug, a.official_url);
            const cheapest = cheapestPlan(a);
            return (
              <tr key={a.slug} className="border-t border-line-soft align-top">
                <td className="px-5 py-3 font-semibold">
                  {link.internal ? <Link href={link.href}>{displayName(a)}</Link> : <a href={outbound(link.href)} rel="noopener">{displayName(a)} ↗</a>}
                  {a.checked_on && <div className="text-[12px] font-normal text-muted">Checked <time dateTime={a.checked_on}>{a.checked_on}</time></div>}
                </td>
                <td className="px-5 py-3">{vendorShort(a)}</td>
                <td className="px-5 py-3">{capitalize(a.category)}</td>
                <td className="px-5 py-3">{capitalize(stated(a.access?.free_tier))}</td>
                <td className="px-5 py-3 font-mono text-[14px]">{cheapest ? `${cheapest.name}: ${formatPrice(cheapest)}` : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
