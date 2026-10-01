import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import Link from "next/link";
import { listCollections } from "@/lib/repositories/catalog";
import styles from "@/components/directory/catalog-page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = withSocial({
  alternates: { canonical: "/collections" },
  title: "AI tool collections",
  description: "Curated, practical paths through the reviewed Ordalin catalogue.",
});

export default async function CollectionsPage() {
  const collections = await listCollections();
  return (
    <main className={`${styles.main} ${styles.wide}`}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Editorial paths</p>
          <h1>AI tool collections</h1>
          <p className={styles.description}>
            Small, practical groups for a job or way of working—not popularity lists.
          </p>
        </div>
        <p className={styles.count}>{collections.length} collections</p>
      </header>
      <section className={styles.collectionGrid} aria-label="Collections">
        {collections.map((collection) => (
          <Link className={styles.collectionCard} href={`/collections/${collection.slug}`} key={collection.slug}>
            <h2>{collection.name}</h2>
            <p>{collection.description}</p>
            <span>{collection.publishedToolCount} reviewed tools →</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
