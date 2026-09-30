import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/directory/catalog-page.module.css";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  alternates: { canonical: "/about/ranking" },
  title: "Ranking and disclosure",
  description: "How Ordalin checks, includes, labels, and orders AI tools.",
};

export default function RankingPage() {
  return (
    <main className={styles.main}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Editorial policy</p>
          <h1>Ranking and disclosure</h1>
          <p className={styles.description}>The catalogue is ordered for usefulness and clarity, not for invented engagement.</p>
        </div>
      </header>
      <div className={styles.prose}>
        <section>
          <h2>How a tool is included</h2>
          <p>Toolify and Product Hunt help us discover candidates. Product facts come from the official website. Discovered tools are published automatically when checks for an AI product, supporting evidence, pricing, category fit, and a website preview pass. Candidates with missing, conflicting, or unsupported information are skipped.</p>
          <p>Automatically published profiles are labelled “Website-checked tool profile”. These checks establish support for the listed website facts; they do not test product performance or constitute an editorial recommendation. Editor Picks and Collections are selected manually.</p>
          <p>A public submitter can begin with an official website, correct the extracted facts, choose a product mark, and confirm publication. A new unique-domain profile is published after validation and labelled “Submitted tool profile”.</p>
        </section>
        <section>
          <h2>How lists are ordered</h2>
          <ul>
            <li><strong>Date added</strong> uses the Ordalin publication date and can be ordered newest or oldest first.</li>
            <li><strong>Editor Picks</strong> are explicit manual selections for relevance and product clarity.</li>
            <li><strong>Collections</strong> are manually ordered around a particular task or workflow.</li>
          </ul>
        </section>
        <section>
          <h2>What does not affect ranking</h2>
          <p>There are no fictional save counts, ratings, usage numbers, or trending scores. Sponsored inventory is absent from this MVP, and payment does not affect organic placement.</p>
        </section>
        <section>
          <h2>Corrections</h2>
          <p>Product details change. Each profile shows when its website or official source was last checked. Existing domains cannot be anonymously overwritten through the submission form; corrections to existing records remain a manual catalogue operation until ownership claims are introduced.</p>
          <p><Link href="/collections">Browse curated collections</Link> or <Link href="/tools">explore the tool catalogue</Link>.</p>
        </section>
      </div>
    </main>
  );
}
