import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import Link from "next/link";
import { Pagination } from "@/components/directory/pagination";
import { ToolList } from "@/components/directory/tool-list";
import { pricingModels } from "@/domain/catalog";
import { formatPricingModel, parsePage } from "@/lib/catalog";
import {
  listCategories,
  listBrowseCategories,
  listPublishedTools,
  listTags,
} from "@/lib/repositories/catalog";
import styles from "@/components/directory/catalog-page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = withSocial({
  title: "Search AI tools",
  description: "Search published AI tools by purpose, category, pricing model, and interface.",
  robots: { index: false, follow: true },
});

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = first(params.q).trim();
  const category = first(params.category);
  const subcategory = first(params.subcategory);
  const pricing = first(params.pricing);
  const tag = first(params.tag);
  const page = parsePage(params.page);
  const [categories, browseCategories, tags, result] = await Promise.all([
    listCategories(),
    listBrowseCategories(category || undefined),
    listTags(),
    listPublishedTools({
      query: query || undefined,
      categorySlug: category || undefined,
      browseCategorySlug: subcategory || undefined,
      pricingModel: pricing || undefined,
      tagSlug: tag || undefined,
      page,
    }),
  ]);

  return (
    <main className={`${styles.main} ${styles.wide}`}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Deterministic catalogue search</p>
          <h1>Search AI tools</h1>
          <p className={styles.description}>Filter published, website-checked entries—without generated recommendations.</p>
        </div>
        <p className={styles.count}>{result.total} results</p>
      </header>

      <form className={styles.searchForm} action="/search" method="get">
        <label className={styles.field}>
          <span>Search</span>
          <input type="search" name="q" defaultValue={query} placeholder="Tool name or purpose" />
        </label>
        <label className={styles.field}>
          <span>Category group</span>
          <select name="category" defaultValue={category}>
            <option value="">All categories</option>
            {categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
        </label>
        <label className={styles.field}>
          <span>Specific category</span>
          <select name="subcategory" defaultValue={subcategory}>
            <option value="">All specific categories</option>
            {browseCategories.map((item) => <option key={`${item.groupSlug}:${item.slug}`} value={item.slug}>{category ? item.name : `${item.groupName} / ${item.name}`}</option>)}
          </select>
        </label>
        <label className={styles.field}>
          <span>Pricing</span>
          <select name="pricing" defaultValue={pricing}>
            <option value="">Any pricing</option>
            {pricingModels.map((item) => <option key={item} value={item}>{formatPricingModel(item)}</option>)}
          </select>
        </label>
        <label className={styles.field}>
          <span>Interface / attribute</span>
          <select name="tag" defaultValue={tag}>
            <option value="">Any interface</option>
            {tags.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
        </label>
        <button type="submit">Search</button>
      </form>

      <p className={styles.decisionPrompt}>
        Know what you want to accomplish?{" "}
        <Link href="/tasks">Find three tools that fit your goal →</Link>
      </p>

      <section className={styles.panel} aria-label="Search results">
        <ToolList tools={result.items} emptyMessage="Try a broader phrase or clear one of the filters." />
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          pathname="/search"
          searchParams={{ q: query, category, subcategory, pricing, tag }}
        />
      </section>
    </main>
  );
}
