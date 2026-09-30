import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/agents/breadcrumb";
import { Checked } from "@/components/agents/checked";
import { Faq } from "@/components/agents/faq";
import { Sources } from "@/components/agents/sources";
import { capitalize, displayName, formatPrice, getAgent, paidPlans, stated } from "@/lib/agents/data";
import { agentHref, PRICING_PAGES } from "@/lib/agents/content";
import { CHECKED_ON, outbound } from "@/lib/agents/site";

export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(PRICING_PAGES).map((slug) => ({ slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { meta } = await PRICING_PAGES[slug].load();
  return { title: { absolute: meta.title }, description: meta.description, alternates: { canonical: `/agents/pricing/${slug}` } };
}

export default async function PricingPage({ params }: Props) {
  const { slug } = await params;
  const entry = PRICING_PAGES[slug];
  if (!entry) notFound();
  const { default: Body, meta } = await entry.load();
  const agent = getAgent(slug);
  const name = displayName(agent);
  const others = entry.compareWith.map(getAgent);

  return (
    <main>
      <section className="border-b border-line">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 pt-8 pb-10 md:px-10 md:pt-10">
          <Breadcrumb items={[{ href: "/agents", label: "AI agents" }, { href: `/agents/${slug}`, label: name }, { href: `/agents/pricing/${slug}`, label: "Pricing" }]} />
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="flex flex-col gap-4">
              <h1 className="font-serif text-[40px] leading-[1.05] font-medium tracking-[-0.02em] md:text-[56px]">{name} pricing</h1>
              <p className="max-w-[760px] text-[17px] leading-normal text-ink-2 md:text-[19px]">{meta.answer}</p>
            </div>
            <Checked on={CHECKED_ON} />
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1080px] flex-col gap-14 px-4 pt-10 md:px-10">
        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-[30px] font-medium md:text-[36px]">Plans that include {name}</h2>
          <div className="rounded-2xl border border-line border-t-4 border-t-side-b bg-surface p-6">
            {agent.access?.free_tier && (
              <div className="flex justify-between border-b border-line-soft py-3">
                <span>Free tier</span>
                <span className="font-mono">{stated(agent.access.free_tier) === "no" ? "None" : capitalize(stated(agent.access.free_tier))}</span>
              </div>
            )}
            {paidPlans(agent).map((p) => (
              <div key={p.name} className="flex justify-between gap-4 border-b border-line-soft py-3">
                <span>
                  {entry.planPrefix} {p.name.replace(/ \d+$/, "")} {/\d+$/.test(p.name) ? `($${p.name.match(/\d+$/)![0]} tier)` : ""}
                  {p.usage && <span className="block text-[14px] text-muted">{p.usage}</span>}
                </span>
                <span className="font-mono">{formatPrice(p)}</span>
              </div>
            ))}
            {agent.access?.required_plan_for_agent && <p className="pt-3 text-[15px] text-ink-2">Plans that include it: {agent.access.required_plan_for_agent}.</p>}
            {agent.access?.subscription_note && <p className="pt-3 text-[15px] text-ink-2">{agent.access.subscription_note}.</p>}
          </div>
        </section>

        <article className="prose-av">
          <Body />
        </article>

        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-[30px] font-medium md:text-[36px]">How it compares</h2>
          <p className="text-[15px] text-muted">Entry price to use each agent, from each maker&apos;s own pricing page.</p>
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full min-w-[560px] text-left text-[15px]">
              <thead className="bg-surface-2 text-muted-2">
                <tr>
                  <th className="px-5 py-3 font-semibold">Agent</th>
                  <th className="px-5 py-3 font-semibold">Free tier</th>
                  <th className="px-5 py-3 font-semibold">Paid plans</th>
                </tr>
              </thead>
              <tbody>
                {[agent, ...others].map((a) => {
                  const link = agentHref(a.slug, a.official_url);
                  return (
                    <tr key={a.slug} className="border-t border-line-soft align-top">
                      <td className="px-5 py-3 font-semibold">
                        <a href={link.internal ? link.href : outbound(link.href)} rel={link.internal ? undefined : "noopener"}>
                          {displayName(a)}
                        </a>
                      </td>
                      <td className="px-5 py-3">{capitalize(stated(a.access?.free_tier))}</td>
                      <td className="px-5 py-3 font-mono text-[14px]">{paidPlans(a).map((p) => `${p.name} ${formatPrice(p)}`).join(" · ") || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <Faq items={meta.faq} />
        <Sources urls={[...new Set([...agent.sources, ...others.flatMap((a) => a.sources)])]} />
      </div>
    </main>
  );
}
