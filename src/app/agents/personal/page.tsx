import type { Metadata } from "next";
import Link from "next/link";
import { AgentsTable } from "@/components/agents/agents-table";
import { Breadcrumb } from "@/components/agents/breadcrumb";
import { Faq } from "@/components/agents/faq";
import { allAgents } from "@/lib/agents/data";
import { agentsPath, HUBS } from "@/lib/agents/content";
import { CHECKED_ON } from "@/lib/agents/site";

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await HUBS.personal();
  return { title: { absolute: meta.title }, description: meta.description, alternates: { canonical: agentsPath.hub("personal") } };
}

export default async function PersonalAgentsPage() {
  const { meta: hub } = await HUBS.personal();
  const agents = allAgents().filter((a) => a.channel === "personal");

  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-16 px-4 pt-8 md:px-10 md:pt-10">
      <section className="flex max-w-[880px] flex-col gap-5">
        <Breadcrumb
          items={[
            { href: agentsPath.overview, label: "AI agents" },
            { href: agentsPath.hub("personal"), label: "Personal agents" },
          ]}
        />
        <h1 className="font-serif text-[40px] leading-[1.05] font-medium tracking-[-0.02em] md:text-[60px]">
          Personal AI agents, <span className="text-side-a">compared</span>
        </h1>
        <p className="text-[18px] leading-normal text-ink-2 md:text-[20px]">
          A personal AI agent does tasks for you instead of only answering questions: it browses, fills in forms, sends messages and books
          things, usually on a computer of its own in the cloud. Prices, what they can do, where they run and how they handle your data come
          from each maker&apos;s own pages. When a maker doesn&apos;t say, we write &quot;Not stated&quot; instead of guessing.
        </p>
        <div className="font-mono text-[13px] text-muted-2">
          {agents.length} personal agents tracked · checked {CHECKED_ON} · <Link href={agentsPath.methodology}>How we check</Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-[30px] font-medium md:text-[36px]">Most compared</h2>
        <Link href={agentsPath.compare("muse-vs-dots")} className="flex flex-col gap-3 rounded-[20px] bg-night p-6 text-on-night hover:text-on-night hover:no-underline md:p-9">
          <span className="text-[13px] font-bold tracking-[0.08em] text-[#B9BCC6] uppercase">New this month</span>
          <span className="font-serif text-[34px] leading-tight md:text-[48px]">
            <span className="text-side-a-soft">Meta Muse</span> <span className="italic opacity-70">vs</span> <span className="text-side-b-soft">ChatGPT Dots</span>
          </span>
          <span className="text-[16px] opacity-85">Free tier vs ChatGPT Pro, errands vs work, and what each does with your data →</span>
        </Link>
        <div className="grid gap-4 md:grid-cols-3">
          {hub.cards.map((c) => (
            <Link key={c.href} href={c.href} className="rounded-2xl border border-line bg-surface p-5 text-ink hover:no-underline">
              <div className="font-bold">{c.title}</div>
              <div className="text-[14px] text-muted">{c.note}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-[30px] font-medium md:text-[36px]">Personal agents we track</h2>
        <AgentsTable agents={agents} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-[30px] font-medium md:text-[36px]">Personal AI agent vs chatbot</h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[560px] border-collapse text-left text-[15px] leading-normal">
            <thead>
              <tr className="border-b border-line">
                <th className="p-3 font-bold"></th>
                <th className="p-3 font-bold">Chatbot</th>
                <th className="p-3 font-bold">Personal agent</th>
              </tr>
            </thead>
            <tbody>
              {hub.kinds.map((k) => (
                <tr key={k.row} className="border-b border-line last:border-0 align-top">
                  <th className="p-3 font-semibold">{k.row}</th>
                  <td className="p-3 text-ink-2">{k.chatbot}</td>
                  <td className="p-3 text-ink-2">{k.agent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Faq items={hub.faq} />

      <p className="text-[14px] text-muted">
        Independent. Not affiliated with, endorsed by, or paid by any company whose product appears here. Product names are trademarks of their
        owners.
      </p>
    </main>
  );
}
