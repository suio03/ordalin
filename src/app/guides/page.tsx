import type { Metadata } from "next";
import Link from "next/link";
import { formatGuideDate, listPublishedGuides } from "@/lib/guides";
import styles from "./guides.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const guides = await listPublishedGuides();
  return {
    title: "Guides",
    description: "Practical, evidence-led guidance for choosing and using AI tools.",
    alternates: { canonical: "/guides" },
    robots: guides.length ? undefined : { index: false, follow: true },
  };
}

export default async function GuidesPage() {
  const guides = await listPublishedGuides();

  return (
    <main className={styles.main}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span><span>Guides</span>
      </nav>

      <header className={styles.indexHeader}>
        <div>
          <p className={styles.eyebrow}>Ordalin field notes</p>
          <h1>Practical guidance for choosing AI tools.</h1>
          <p>
            Evidence-led explanations for comparing capabilities, pricing, and
            fit without relying on rankings or marketing claims.
          </p>
        </div>
        <p className={styles.issueCount}>{guides.length} published</p>
      </header>

      {guides.length ? (
        <section className={styles.guideGrid} aria-label="Published guides">
          {guides.map((guide, index) => (
            <Link className={styles.guideCard} href={`/guides/${guide.slug}`} key={guide.slug}>
              <span className={styles.cardNumber}>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <p className={styles.cardMeta}>{formatGuideDate(guide.publishedAt)}</p>
                <h2>{guide.title}</h2>
                <p>{guide.description}</p>
              </div>
              <span className={styles.cardAction}>Read guide ↗</span>
            </Link>
          ))}
        </section>
      ) : (
        <section className={styles.emptyState} aria-labelledby="empty-guides-title">
          <p className={styles.emptyIndex}>Guide index · 00</p>
          <div>
            <h2 id="empty-guides-title">No guides published yet.</h2>
            <p>
              The guide system is ready. Until the first evidence-led article is
              published, use the live catalogue or start from a specific goal.
            </p>
            <div className={styles.emptyActions}>
              <Link href="/tools">Browse AI tools</Link>
              <Link href="/tasks">Find tools by goal</Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
