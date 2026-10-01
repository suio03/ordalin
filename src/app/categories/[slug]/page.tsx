import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pagination } from "@/components/directory/pagination";
import { ToolList } from "@/components/directory/tool-list";
import { indexableCategoryMinimum, parsePage } from "@/lib/catalog";
import {
  getCategoryBySlug,
  listBrowseCategories,
  listPublishedTools,
} from "@/lib/repositories/catalog";
import styles from "@/components/directory/catalog-page.module.css";

export const dynamic = "force-dynamic";

type CategoryParams = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

const getCategoryPage = cache(async (slug: string, page: number) => {
  const [category, result] = await Promise.all([
    getCategoryBySlug(slug),
    listPublishedTools({ categorySlug: slug, page }),
  ]);
  if (!category || page > result.totalPages) notFound();
  return { category, result };
});

export async function generateMetadata({ params, searchParams }: CategoryParams): Promise<Metadata> {
  const slug = (await params).slug;
  const page = parsePage((await searchParams).page);
  const { category } = await getCategoryPage(slug, page);
  return withSocial({
    title: `${category.name} AI tools`,
    description: category.description,
    alternates: { canonical: `/categories/${slug}${page > 1 ? `?page=${page}` : ""}` },
    robots:
      category.publishedToolCount >= indexableCategoryMinimum
        ? { index: true, follow: true }
        : { index: false, follow: true },
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryParams) {
  const slug = (await params).slug;
  const page = parsePage((await searchParams).page);
  const [{ category, result }, browseCategories] = await Promise.all([
    getCategoryPage(slug, page),
    listBrowseCategories(slug),
  ]);
  const isIndexable = category.publishedToolCount >= indexableCategoryMinimum;

  return (
    <main className={`${styles.main} ${styles.wide}`}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span><span>Categories</span>
      </nav>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Tool category</p>
          <h1>{category.name} AI tools</h1>
          <p className={styles.description}>{category.description}</p>
        </div>
        <p className={styles.count}>{result.total} published {result.total === 1 ? "tool" : "tools"}</p>
      </header>
      {!isIndexable ? (
        <p className={styles.notice}>
          This category is useful to browse but stays out of search indexes until it has at least {indexableCategoryMinimum} published tools.
        </p>
      ) : null}
      {browseCategories.length ? (
        <section className={styles.categoryIndex} aria-labelledby="specific-categories-title">
          <div className={styles.categoryIndexHeading}>
            <p className={styles.eyebrow}>Specific uses</p>
            <h2 id="specific-categories-title">Browse {category.name.toLowerCase()}</h2>
          </div>
          <div className={styles.categoryIndexList}>
            {browseCategories.map((item) => (
              <Link key={item.slug} href={`/categories/${slug}/${item.slug}`}>
                <span>{item.name}</span>
                <small>{item.publishedToolCount} {item.publishedToolCount === 1 ? "tool" : "tools"}</small>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <section className={styles.panel} aria-label={`${category.name} tools`}>
        <ToolList tools={result.items} />
        <Pagination page={result.page} totalPages={result.totalPages} pathname={`/categories/${slug}`} />
      </section>
    </main>
  );
}
