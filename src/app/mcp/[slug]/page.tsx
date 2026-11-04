import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/agents/breadcrumb";
import { Checked } from "@/components/agents/checked";
import { Faq } from "@/components/agents/faq";
import { Sources } from "@/components/agents/sources";
import { JsonLd } from "@/components/agents/json-ld";
import { Collapsible, FitCards, HowItWorks, SampleCard, sectionHeading, Steps, TestRuns, TestShots } from "@/components/skills/test-parts";
import { absoluteUrl } from "@/lib/agents/site";
import { getServer, loadServerPage, mcpPath, NOT_STATED, stated, visibleServerSlugs } from "@/lib/mcp/data";
import type { McpServer } from "@/lib/mcp/types";

export const generateStaticParams = () => visibleServerSlugs().map((slug) => ({ slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadServerPage(slug);
  if (!page) notFound();
  return withSocial({ title: { absolute: page.meta.title }, description: page.meta.description, alternates: { canonical: mcpPath.server(slug) } });
}

const factRows = (server: McpServer): [string, string][] => [
  ["Maintainer", `${server.maintainer} (${server.kind === "official" ? "official" : "community"})`],
  ["Licence", stated(server.license)],
  ["Version checked", stated(server.version)],
  ["Transport", stated(server.transport)],
  ["Needs", stated(server.requires)],
  ["Works with", stated(server.clients)],
  ["Install", stated(server.install)],
];

export default async function McpServerPage({ params }: Props) {
  const { slug } = await params;
  const page = await loadServerPage(slug);
  if (!page) notFound();
  const { default: Body, meta } = page;
  const server = getServer(slug);
  const { test } = meta;

  return (
    <main>
      <section className="border-b border-line">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 pt-8 pb-10 md:px-10 md:pt-10">
          <Breadcrumb items={[{ href: mcpPath.overview, label: "MCP servers" }, { href: mcpPath.server(slug), label: server.name }]} />
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="flex flex-col gap-4">
              <h1 className="font-serif text-[40px] leading-[1.05] font-medium tracking-[-0.02em] md:text-[56px]">{server.name}</h1>
              <p className="max-w-[760px] text-[17px] leading-normal text-ink-2 md:text-[19px]">{meta.verdict ?? meta.summary}</p>
            </div>
            <Checked on={server.checked_on}>
              <div>
                Tested {test.date} in {test.client.split(",")[0]}
              </div>
            </Checked>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1080px] flex-col gap-14 px-4 pt-10 md:px-10">
        {(test.runs || test.shots) && (
          <section className="flex flex-col gap-5">
            <h2 className={sectionHeading}>What our test produced</h2>
            {test.runs && <TestRuns runs={test.runs} />}
            {test.shots && <TestShots shots={test.shots} />}
          </section>
        )}

        <FitCards bestFor={meta.bestFor} notFor={meta.notFor} />

        {meta.howItWorks && <HowItWorks parts={meta.howItWorks} />}

        {meta.setup && <Steps heading="Set it up" steps={meta.setup} />}

        <section className="flex flex-col gap-5">
          <h2 className={sectionHeading}>What it can access</h2>
          <ul className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-6 text-[16px] leading-snug shadow-card">
            {meta.permissions.map((x) => (
              <li key={x} className="flex gap-3">
                <span aria-hidden className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[var(--color-text-tertiary)]" />
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className={sectionHeading}>Reference</h2>
          {meta.tools && (
            <Collapsible title="Tools it adds" count={meta.tools.length}>
              <dl>
                {meta.tools.map((tool) => (
                  <div key={tool.name} className="grid gap-1 border-b border-line-soft px-5 py-4 text-[15px] last:border-b-0 md:grid-cols-[240px_1fr]">
                    <dt className="font-mono text-[14px] font-semibold">{tool.name}</dt>
                    <dd className="text-muted-2">{tool.text}</dd>
                  </div>
                ))}
              </dl>
            </Collapsible>
          )}
          <Collapsible title="Key facts">
            <dl>
              {factRows(server).map(([label, value]) => (
                <div key={label} className="grid gap-1 border-b border-line-soft px-5 py-4 text-[15px] last:border-b-0 md:grid-cols-[200px_1fr] md:text-[16px]">
                  <dt className="font-semibold text-muted-2">{label}</dt>
                  <dd className={value === NOT_STATED ? "text-muted" : ""}>{value}</dd>
                </div>
              ))}
            </dl>
            <p className="px-5 pb-4 text-[13px] text-muted">From the server&rsquo;s own repository or docs. &ldquo;{NOT_STATED}&rdquo; means they do not say.</p>
          </Collapsible>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className={sectionHeading}>Our test</h2>
          {meta.verdict && <p className="max-w-[760px] text-[17px] leading-relaxed text-muted-2">{meta.summary}</p>}
          <div className="font-mono text-[13px] text-muted-2">
            {test.date} · {test.client} · {test.model} · version {test.version}
          </div>
          <div className="rounded-2xl bg-surface-2 p-5 text-[15px]">
            <div className="mb-1 text-[13px] font-bold tracking-[0.06em] text-muted uppercase">What we asked</div>
            <p className="whitespace-pre-line">{test.task}</p>
          </div>
          <Collapsible title="Tools listed on connect" count={test.listed.reduce((n, line) => n + (line.includes(":") ? line.split(",").length : 1), 0)}>
            <p className="px-5 py-4 font-mono text-[13px] leading-relaxed whitespace-pre-line">{test.listed.join(test.listed.some((l) => l.includes(":")) ? "\n\n" : ", ")}</p>
          </Collapsible>
          <div className="grid gap-4 lg:grid-cols-2">
            {test.samples.map((sample) => (
              <SampleCard key={sample.label} sample={sample} mono />
            ))}
          </div>
          <article className="prose-av">
            <Body />
          </article>
        </section>

        <Faq items={meta.faq} />
        <Sources title="Repository" urls={[server.repo]} />
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareSourceCode",
          name: server.name,
          codeRepository: server.repo,
          license: server.license,
          mainEntityOfPage: absoluteUrl(mcpPath.server(slug)),
        }}
      />
    </main>
  );
}
