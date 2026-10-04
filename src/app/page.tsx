import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { ToolMark } from "@/components/directory/tool-mark";
import { EditorialCard } from "@/components/editorial/editorial-parts";
import { formatPricingModel } from "@/lib/catalog";
import { editorialHref, type EditorialPage } from "@/lib/editorial";
import { listLiveEditorial } from "@/lib/editorial/load";
import { pinnedHomepageGuides } from "@/content/editorial";
import {
  listCategories,
  listCollections,
  listPublishedTools,
  listTasks,
  type ToolCard,
} from "@/lib/repositories/catalog";
import styles from "@/components/home/home.module.css";

export const dynamic = "force-dynamic";

const legacyCatalogueParams = ["q", "category", "pricing", "sort", "page"];

export const metadata: Metadata = withSocial({
  title: { absolute: "Ordalin — find the right AI tool for the job" },
  description: "Browse AI tools by category, read which ones suit which jobs, and compare options with pricing and platforms checked against official websites.",
  alternates: { canonical: "/" },
});

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function ShelfTool({ tool }: { tool: ToolCard }) {
  return (
    <Link className={styles.toolCard} href={`/tools/${tool.slug}`}>
      <ToolMark name={tool.name} logoAssetKey={tool.logoAssetKey} />
      <strong>{tool.name}</strong>
      <span className={styles.toolTagline}>{tool.tagline}</span>
      <span className={styles.toolMeta}>
        {formatPricingModel(tool.pricingModel)}
        {tool.isEditorPick ? <span className={styles.pickBadge}> · Editor pick</span> : null}
      </span>
    </Link>
  );
}

function ToolGrid({ tools }: { tools: ToolCard[] }) {
  return (
    <ul className={styles.toolGrid}>
      {tools.map((tool) => <li key={tool.slug}><ShelfTool tool={tool} /></li>)}
    </ul>
  );
}

export default async function Home({ searchParams }: HomeProps) {
  // The catalogue lived at "/" before /tools; keep old shared filter links working.
  const params = await searchParams;
  if (legacyCatalogueParams.some((key) => params[key] !== undefined)) {
    const query = new URLSearchParams();
    for (const key of legacyCatalogueParams) {
      const value = params[key];
      if (typeof value === "string") query.set(key, value);
      else if (Array.isArray(value) && value[0]) query.set(key, value[0]);
    }
    permanentRedirect(`/tools?${query}`);
  }

  const [groups, latest, collections, tasks, editorial] = await Promise.all([
    listCategories(),
    listPublishedTools({ pageSize: 4 }),
    listCollections(),
    listTasks(),
    listLiveEditorial(),
  ]);
  const shelves = await Promise.all(
    groups.map(async (group) => ({
      group,
      tools: (await listPublishedTools({ categorySlug: group.slug, pageSize: 4, featuredFirst: true })).items,
      best: editorial.pages.find((page): page is Extract<EditorialPage, { kind: "best" }> =>
        page.kind === "best" && page.groupSlug === group.slug),
    })),
  );
  const pinRank = (page: EditorialPage) => {
    const rank = pinnedHomepageGuides.indexOf(editorialHref(page));
    return rank === -1 ? pinnedHomepageGuides.length : rank;
  };
  const guides = [...editorial.pages].sort((left, right) => pinRank(left) - pinRank(right)).slice(0, 3);

  return (
    <main className={styles.main}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div>
          <p className={styles.eyebrow}>AI tool directory</p>
          <h1 id="home-title">Find the right AI tool for the job.</h1>
          <p className={styles.intro}>
            {latest.total} tools, each with pricing, platforms and the date its
            official website was last checked. No paid placement.
          </p>
        </div>
        <form className={styles.searchBox} role="search" aria-label="Search tools" action="/tools" method="get">
          <label className={styles.srOnly} htmlFor="home-search">Search tools</label>
          <span aria-hidden="true">⌕</span>
          <input id="home-search" type="search" name="q" placeholder="Search by tool, purpose, or tag" />
          <button type="submit">Search</button>
        </form>
      </section>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <nav aria-label="Tool categories">
            <p className={styles.label}>Categories</p>
            <ul className={styles.categories}>
              <li><Link href="/tools">All tools<span className={styles.count}>{latest.total}</span></Link></li>
              {groups.map((group) => (
                <li key={group.slug}>
                  <Link href={`/categories/${group.slug}`}>
                    {group.name}
                    <span className={styles.count}>{group.publishedToolCount}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav className={styles.sidebarMore} aria-label="More ways to browse">
            <p className={styles.label}>Browse</p>
            <ul>
              {tasks.length ? <li><Link href="/tasks">Find by goal</Link></li> : null}
              {collections.length ? <li><Link href="/collections">Collections</Link></li> : null}
              {editorial.pages.some((page) => page.kind === "best") ? <li><Link href="/best">Best-of lists</Link></li> : null}
              {editorial.pages.some((page) => page.kind === "compare") ? <li><Link href="/compare">Comparisons</Link></li> : null}
            </ul>
          </nav>
        </aside>

        <div className={styles.content}>
          {guides.length ? (
            <section className={styles.shelf} aria-labelledby="guides-title">
              <div className={styles.shelfHeader}>
                <h2 id="guides-title">Guides to start with</h2>
                <div className={styles.shelfLinks}>
                  {editorial.pages.some((page) => page.kind === "best") ? <Link href="/best">Best-of lists →</Link> : null}
                  {editorial.pages.some((page) => page.kind === "alternatives") ? <Link href="/alternatives">Alternatives →</Link> : null}
                  {editorial.pages.some((page) => page.kind === "compare") ? <Link href="/compare">Comparisons →</Link> : null}
                </div>
              </div>
              <div className={styles.guideGrid}>
                {guides.map((page) => <EditorialCard key={editorialHref(page)} page={page} tools={editorial.tools} />)}
              </div>
            </section>
          ) : null}

          {latest.items.length ? (
            <section className={styles.shelf} aria-labelledby="latest-title">
              <div className={styles.shelfHeader}>
                <h2 id="latest-title">Just added</h2>
                <div className={styles.shelfLinks}><Link href="/tools">All tools →</Link></div>
              </div>
              <ToolGrid tools={latest.items} />
            </section>
          ) : null}

          {shelves.filter((shelf) => shelf.tools.length).map(({ group, tools, best }) => (
            <section className={styles.shelf} key={group.slug} aria-labelledby={`shelf-${group.slug}`}>
              <div className={styles.shelfHeader}>
                <h2 id={`shelf-${group.slug}`}>{group.name}</h2>
                <div className={styles.shelfLinks}>
                  {best ? <Link href={editorialHref(best)}>Best of →</Link> : null}
                  <Link href={`/categories/${group.slug}`}>All {group.publishedToolCount} →</Link>
                </div>
              </div>
              <ToolGrid tools={tools} />
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
