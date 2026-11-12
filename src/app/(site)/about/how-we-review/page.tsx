import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import Link from "next/link";
import styles from "@/components/directory/catalog-page.module.css";

export const metadata: Metadata = withSocial({
  alternates: { canonical: "/about/how-we-review" },
  title: "How we review AI tools",
  description: "How Ordalin researches tool profiles, writes best-of lists, alternatives and comparisons, and keeps facts tied to official sources.",
});

export default function HowWeReviewPage() {
  return (
    <main className={styles.main}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Editorial policy</p>
          <h1>How we review</h1>
          <p className={styles.description}>
            Facts come from each tool&apos;s official website. Judgement is ours,
            labelled as such, and never for sale.
          </p>
        </div>
      </header>
      <div className={styles.prose}>
        <section>
          <h2>Tool profiles</h2>
          <p>Every published profile is researched from the product&apos;s own website: its homepage, pricing and billing pages, documentation and help centre. Each factual claim — a feature, a plan, a free-use limit, a supported platform — keeps the official URL and a quote that supports it. When official pages do not establish something, the profile says so rather than guessing.</p>
          <p>Each profile shows the date its sources were last checked. Pricing and plans change; if you spot something out of date, <a href="https://github.com/suio03/ordalin/issues">tell us</a>.</p>
        </section>
        <section>
          <h2>Best-of lists, alternatives and comparisons</h2>
          <p>Editorial pages answer a specific question: which tool suits a job, what to use instead of a well-known product, or how two tools differ. For each pick we write who should choose it, who should look elsewhere, and what separates it from the others.</p>
          <p>Pricing, platforms and check dates on these pages are read live from the tool profiles, so an article cannot quietly disagree with the catalogue. If a tool is removed from the catalogue, articles that depend on it are withdrawn until they are revised.</p>
          <p>Unless a page says otherwise, picks are based on official product documentation, pricing pages and the published product workflow, not on long-term hands-on testing of every tool. We say which it is.</p>
        </section>
        <section>
          <h2>What we will not do</h2>
          <ul>
            <li>Accept payment for inclusion, position or a favourable verdict.</li>
            <li>Invent ratings, user counts, trending scores or testimonials.</li>
            <li>Present marketing claims as our findings.</li>
          </ul>
        </section>
        <section>
          <h2>Corrections and submissions</h2>
          <p>Makers can <Link href="/submit">submit a tool</Link>. Submission does not buy placement in editorial pages. Corrections to existing records are handled manually.</p>
          <p><Link href="/tools">Browse all tools</Link> or <Link href="/best">read the best-of lists</Link>.</p>
        </section>
      </div>
    </main>
  );
}
