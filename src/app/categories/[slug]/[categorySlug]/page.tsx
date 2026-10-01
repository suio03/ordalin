import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pagination } from "@/components/directory/pagination";
import { ToolList } from "@/components/directory/tool-list";
import styles from "@/components/directory/catalog-page.module.css";
import { indexableCategoryMinimum, parsePage } from "@/lib/catalog";
import {
  getBrowseCategory,
  listPublishedTools,
} from "@/lib/repositories/catalog";

export const dynamic = "force-dynamic";

type BrowseCategoryParams = {
  params: Promise<{ slug: string; categorySlug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

const getBrowseCategoryPage = cache(async (slug: string, categorySlug: string, page: number) => {
  const [category, result] = await Promise.all([
    getBrowseCategory(slug, categorySlug),
    listPublishedTools({ browseCategorySlug: categorySlug, page }),
  ]);
  if (!category || page > result.totalPages) notFound();
  return { category, result };
});

export async function generateMetadata({
  params, searchParams,
}: BrowseCategoryParams): Promise<Metadata> {
  const { slug, categorySlug } = await params;
  const page = parsePage((await searchParams).page);
  const { category } = await getBrowseCategoryPage(slug, categorySlug, page);
  return withSocial({
    title: `${category.name} AI tools`,
    description: category.description,
    alternates: { canonical: `/categories/${slug}/${categorySlug}${page > 1 ? `?page=${page}` : ""}` },
    robots:
      category.publishedToolCount >= indexableCategoryMinimum
        ? { index: true, follow: true }
        : { index: false, follow: true },
  });
}

export default async function BrowseCategoryPage({
  params,
  searchParams,
}: BrowseCategoryParams) {
  const { slug, categorySlug } = await params;
  const page = parsePage((await searchParams).page);
  const { category, result } = await getBrowseCategoryPage(slug, categorySlug, page);

  const isIndexable = category.publishedToolCount >= indexableCategoryMinimum;
  const pathname = `/categories/${slug}/${categorySlug}`;

  return (
    <main className={`${styles.main} ${styles.wide}`}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/categories/${category.groupSlug}`}>{category.groupName}</Link>
        <span aria-hidden="true">/</span>
        <span>{category.name}</span>
      </nav>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>{category.groupName}</p>
          <h1>{category.name} AI tools</h1>
          <p className={styles.description}>{category.description}</p>
        </div>
        <p className={styles.count}>{result.total} published {result.total === 1 ? "tool" : "tools"}</p>
      </header>
      {!isIndexable ? (
        <p className={styles.notice}>
          This category is available to browse but stays out of search indexes until it has at least {indexableCategoryMinimum} published tools.
        </p>
      ) : null}
      <section className={styles.panel} aria-label={`${category.name} tools`}>
        <ToolList tools={result.items} />
        <Pagination page={result.page} totalPages={result.totalPages} pathname={pathname} />
      </section>
    </main>
  );
}
