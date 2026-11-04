import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import Link from "next/link";
import { getServer, HUB_INDEX_MINIMUM, mcpPath, OVERVIEW, publishedServerSlugs, visibleServerSlugs } from "@/lib/mcp/data";

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await OVERVIEW();
  return withSocial({
    title: { absolute: meta.title },
    description: meta.description,
    alternates: { canonical: mcpPath.overview },
    robots: publishedServerSlugs().length >= HUB_INDEX_MINIMUM ? undefined : { index: false, follow: true },
  });
}

export default async function McpOverviewPage() {
  const { meta } = await OVERVIEW();
  const servers = visibleServerSlugs().map(getServer);

  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-16 px-4 pt-12 md:px-10 md:pt-16">
      <section className="flex max-w-[880px] flex-col gap-5">
        <h1 className="font-serif text-[40px] leading-[1.05] font-medium tracking-[-0.02em] md:text-[60px]">{meta.heading}</h1>
        <p className="text-[18px] leading-normal text-ink-2 md:text-[20px]">{meta.intro}</p>
        <div className="font-mono text-[13px] text-muted-2">{servers.length} servers tested</div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {servers.map((server) => (
          <Link key={server.slug} href={mcpPath.server(server.slug)} className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-5 text-ink hover:no-underline">
            <span className="font-bold">{server.name}</span>
            <span className="text-[14px] text-muted">{server.does}</span>
            <span className="text-[13px] text-muted-2">
              {server.maintainer} · {server.kind === "official" ? "Official" : "Community"} · {server.license}
            </span>
          </Link>
        ))}
      </section>

      <p className="text-[14px] text-muted">
        Independent. Not affiliated with, endorsed by, or paid by any server maintainer. We link to each repository and run every server ourselves before we publish its page.
      </p>
    </main>
  );
}
