import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ToolList } from "@/components/directory/tool-list";
import {
  getCollectionBySlug,
  listCollectionTools,
} from "@/lib/repositories/catalog";
import styles from "@/components/directory/catalog-page.module.css";

export const dynamic = "force-dynamic";

type CollectionParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: CollectionParams): Promise<Metadata> {
  const collection = await getCollectionBySlug((await params).slug);
  return collection
    ? {
        title: collection.name,
        description: collection.description,
        alternates: { canonical: `/collections/${collection.slug}` },
      }
    : {};
}

export default async function CollectionPage({ params }: CollectionParams) {
  const slug = (await params).slug;
  const [collection, tools] = await Promise.all([
    getCollectionBySlug(slug),
    listCollectionTools(slug),
  ]);
  if (!collection) notFound();

  return (
    <main className={`${styles.main} ${styles.wide}`}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/collections">Collections</Link>
      </nav>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Curated collection</p>
          <h1>{collection.name}</h1>
          <p className={styles.description}>{collection.description}</p>
        </div>
        <p className={styles.count}>{tools.length} reviewed tools</p>
      </header>
      <section className={styles.panel} aria-label={`${collection.name} tools`}>
        <ToolList tools={tools} />
      </section>
    </main>
  );
}
