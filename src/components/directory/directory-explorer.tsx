"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { pricingModels } from "@/domain/catalog";
import { formatPricingModel, type CatalogueSort } from "@/lib/catalog";
import type {
  CollectionSummary,
  ToolCard,
} from "@/lib/repositories/catalog";
import { SearchTracker } from "@/components/search-tracker";
import { Pagination } from "./pagination";
import { ToolRow } from "./tool-row";
import styles from "./explorer.module.css";

type ExplorerState = {
  query: string;
  category: string;
  pricing: string;
  sort: CatalogueSort;
};

type DirectoryCategory = {
  slug: string;
  name: string;
};

export function DirectoryExplorer({
  categories,
  tools,
  total,
  page,
  totalPages,
  editorPicks,
  collections,
  initialState,
  basePath = "/tools",
}: {
  categories: DirectoryCategory[];
  tools: ToolCard[];
  total: number;
  page: number;
  totalPages: number;
  editorPicks: ToolCard[];
  collections: CollectionSummary[];
  initialState: ExplorerState;
  basePath?: string;
}) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const { category, pricing, sort } = initialState;

  function catalogueHref(next: Partial<ExplorerState>) {
    const state = { ...initialState, ...next };
    const params = new URLSearchParams();
    const query = state.query.trim();
    if (query) params.set("q", query);
    if (state.category !== "all") params.set("category", state.category);
    if (state.pricing !== "all") params.set("pricing", state.pricing);
    if (state.sort === "oldest") params.set("sort", state.sort);
    const search = params.toString();
    return search ? `${basePath}?${search}` : basePath;
  }

  function updateCatalogue(next: Partial<ExplorerState>) {
    router.push(catalogueHref(next), { scroll: false });
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape" && document.activeElement === searchRef.current) {
        if (searchRef.current) searchRef.current.value = "";
        const params = new URLSearchParams(window.location.search);
        params.delete("q");
        params.delete("page");
        const search = params.toString();
        router.push(search ? `${basePath}?${search}` : basePath, { scroll: false });
        searchRef.current?.blur();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [basePath, router]);

  function resetFilters() {
    if (searchRef.current) searchRef.current.value = "";
    router.push(basePath, { scroll: false });
    searchRef.current?.focus();
  }

  return (
    <main className={styles.main}>
      <SearchTracker query={initialState.query} total={total} page={page} />
      <section className={styles.hero} aria-labelledby="home-title">
        <div>
          <p className={styles.eyebrow}>All AI tools</p>
          <h1 id="home-title">Browse the full catalogue.</h1>
          <p className={styles.intro}>
            Every published tool, with pricing, category, and the date its
            official website was last checked.
          </p>
        </div>
        <form
          className={styles.searchBox}
          role="search"
          aria-label="Search tools"
          action={basePath}
          method="get"
          onSubmit={(event) => {
            event.preventDefault();
            updateCatalogue({ query: searchRef.current?.value ?? "" });
          }}
        >
          <label className={styles.srOnly} htmlFor="home-search">Search tools</label>
          <span aria-hidden="true">⌕</span>
          <input
            id="home-search"
            ref={searchRef}
            key={initialState.query}
            type="search"
            name="q"
            defaultValue={initialState.query}
            placeholder="Search by tool, purpose, or tag"
          />
          {category !== "all" ? <input type="hidden" name="category" value={category} /> : null}
          {pricing !== "all" ? <input type="hidden" name="pricing" value={pricing} /> : null}
          {sort === "oldest" ? <input type="hidden" name="sort" value={sort} /> : null}
          <kbd aria-hidden="true">/</kbd>
        </form>
      </section>

      <nav className={styles.mobileCategories} aria-label="Tool categories">
        <button
          type="button"
          aria-pressed={category === "all"}
          onClick={() => updateCatalogue({ category: "all" })}
        >
          All
        </button>
        {categories.map((item) => (
          <button
            type="button"
            key={item.slug}
            aria-pressed={category === item.slug}
            onClick={() => updateCatalogue({ category: item.slug })}
          >
            {item.name}
          </button>
        ))}
      </nav>

      <section className={styles.radarField} aria-label="Tool navigation radar">
        <aside className={styles.categoryPanel}>
          <p className={styles.panelLabel}>Categories</p>
          <button
            type="button"
            aria-pressed={category === "all"}
            className={category === "all" ? styles.activeCategory : undefined}
            onClick={() => updateCatalogue({ category: "all" })}
          >
            <span>All tools</span>
          </button>
          {categories.map((item) => (
            <button
              type="button"
              key={item.slug}
              aria-pressed={category === item.slug}
              className={category === item.slug ? styles.activeCategory : undefined}
              onClick={() => updateCatalogue({ category: item.slug })}
            >
              <span>{item.name}</span>
            </button>
          ))}
          <Link href="/tasks">Find tools by goal →</Link>
          <Link href="/collections">Browse collections →</Link>
        </aside>

        <section className={styles.catalogue} aria-labelledby="catalogue-title">
          <div className={styles.catalogueHeader}>
            <div>
              <p className={styles.panelLabel}>Live catalogue</p>
              <h2 id="catalogue-title">Browse AI tools</h2>
            </div>
          </div>

          <div className={styles.filterBar}>
            <label>
              <span>Category</span>
              <select value={category} onChange={(event) => updateCatalogue({ category: event.target.value })}>
                <option value="all">All categories</option>
                {categories.map((item) => (
                  <option key={item.slug} value={item.slug}>{item.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Pricing</span>
              <select value={pricing} onChange={(event) => updateCatalogue({ pricing: event.target.value })}>
                <option value="all">Any pricing</option>
                {pricingModels.map((item) => (
                  <option key={item} value={item}>{formatPricingModel(item)}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Date added</span>
              <select value={sort} onChange={(event) => updateCatalogue({ sort: event.target.value as CatalogueSort })}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
            <p aria-live="polite">
              {total} {total === 1 ? "result" : "results"}
            </p>
          </div>

          <div className={styles.results}>
            {tools.length ? (
              tools.map((tool) => <ToolRow key={tool.id} tool={tool} />)
            ) : (
              <div className={styles.emptyState}>
                <h3>No matching tools</h3>
                <p>Try another category, pricing model, sort order, or search.</p>
                <button type="button" onClick={resetFilters}>Reset filters</button>
              </div>
            )}
          </div>
          {totalPages > 1 ? (
            <div className={styles.paginationWrap}>
              <Pagination
                page={page}
                totalPages={totalPages}
                pathname={basePath}
                searchParams={{
                  q: initialState.query || undefined,
                  category: category === "all" ? undefined : category,
                  pricing: pricing === "all" ? undefined : pricing,
                  sort: sort === "oldest" ? sort : undefined,
                }}
              />
            </div>
          ) : null}
        </section>

        <aside className={styles.editorialRail}>
          <section className={`${styles.railPanel} ${styles.collectionPanel}`}>
            <p className={styles.panelLabel}>Collections</p>
            <h2>Useful ways in</h2>
            <div className={styles.collectionList}>
              {collections.slice(0, 4).map((collection) => (
                <Link key={collection.slug} href={`/collections/${collection.slug}`}>
                  <span>{collection.name}</span>
                  <small>{collection.publishedToolCount} tools</small>
                </Link>
              ))}
            </div>
            <Link className={styles.textLink} href="/collections">View all collections →</Link>
            <br />
            <Link className={styles.textLink} href="/tasks">Find tools by goal →</Link>
          </section>

          <section className={`${styles.railPanel} ${styles.picksPanel}`}>
            <p className={styles.panelLabel}>Editor picks</p>
            <h2>Worth a closer look</h2>
            <ol className={styles.pickList}>
              {editorPicks.map((tool) => (
                <li key={tool.id}>
                  <Link href={`/tools/${tool.slug}`}>{tool.name}</Link>
                  <span>{tool.primaryCategory.name}</span>
                </li>
              ))}
            </ol>
          </section>


        </aside>
      </section>
    </main>
  );
}
