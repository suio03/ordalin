import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatGuideDate,
  getPublishedGuide,
  listPublishedGuides,
} from "@/lib/guides";
import styles from "../guides.module.css";

type GuideParams = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  const guides = await listPublishedGuides();
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: GuideParams): Promise<Metadata> {
  const guide = await getPublishedGuide((await params).slug);
  if (!guide) return {};
  return withSocial({
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.description,
      publishedTime: `${guide.publishedAt}T00:00:00Z`,
      modifiedTime: `${guide.updatedAt ?? guide.publishedAt}T00:00:00Z`,
      authors: [guide.author],
    },
  });
}

export default async function GuidePage({ params }: GuideParams) {
  const guide = await getPublishedGuide((await params).slug);
  if (!guide) notFound();
  const { Content } = guide;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt ?? guide.publishedAt,
    author: { "@type": "Organization", name: guide.author },
    publisher: { "@type": "Organization", name: "Ordalin", url: baseUrl },
    mainEntityOfPage: `${baseUrl}/guides/${guide.slug}`,
  };

  return (
    <main className={`${styles.main} ${styles.articleMain}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
        }}
      />
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span>
        <Link href="/guides">Guides</Link><span aria-hidden="true">/</span>
        <span>{guide.title}</span>
      </nav>

      <article>
        <header className={styles.articleHeader}>
          <p className={styles.eyebrow}>Ordalin guide</p>
          <h1>{guide.title}</h1>
          <p className={styles.articleDescription}>{guide.description}</p>
        </header>

        <div className={styles.articleGrid}>
          <aside className={styles.articleLedger} aria-label="Guide details">
            <dl>
              <div><dt>Published</dt><dd>{formatGuideDate(guide.publishedAt)}</dd></div>
              {guide.updatedAt ? <div><dt>Updated</dt><dd>{formatGuideDate(guide.updatedAt)}</dd></div> : null}
              <div><dt>By</dt><dd>{guide.author}</dd></div>
              {guide.topics?.length ? <div><dt>Topics</dt><dd>{guide.topics.join(" · ")}</dd></div> : null}
            </dl>
            {guide.relatedLinks?.length ? (
              <div className={styles.relatedLinks}>
                <p>Continue exploring</p>
                {guide.relatedLinks.map((link) => (
                  <Link href={link.href} key={link.href}>{link.label} →</Link>
                ))}
              </div>
            ) : null}
          </aside>
          <div className={styles.prose}>
            <Content />
          </div>
        </div>
      </article>
    </main>
  );
}
