import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/account/credits";
import styles from "@/components/directory/catalog-page.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/terms" },
  title: "Submission terms and privacy",
  description: "How Ordalin accounts, free submissions and listing credits work, and what data we keep.",
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <main className={styles.main}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Updated 8 November 2026</p>
          <h1>Submission terms and privacy</h1>
          <p className={styles.description}>How accounts, the free submission and listing credits work, and what we keep about you.</p>
        </div>
      </header>
      <div className={styles.prose}>
        <section>
          <h2>Accounts</h2>
          <p>You sign in with Google to submit a tool or buy credits. One person may hold one account. Accounts used to get around the free-submission limit, to submit misleading listings, or to dispute payments that were delivered may be closed, and their credits removed.</p>
        </section>
        <section>
          <h2>The free submission</h2>
          <p>Each person gets one free submission. It goes through our strict review: we list tools from the company that builds them, and decline resellers, model wrappers and sites without a working product. A declined free submission is not returned. The free submission is tied to your account and to the browser and network you use, so a new Google account on the same device or connection does not get another one.</p>
        </section>
        <section>
          <h2>Listing credits</h2>
          <ul>
            <li>Credits come in three packs, paid once through PayPal: US$3.99 for 1, US$5.99 for 3 or US$9.99 for 10. There is no subscription.</li>
            <li>Credits you have bought keep their value if prices change later.</li>
            <li>Credits never expire. One credit covers one submitted product.</li>
            <li>Credit submissions are reviewed within 48 hours. Sites built on third-party models are accepted and labelled in their profile as third-party, not official.</li>
            <li>We still decline submissions that are not an AI product, have no working product, show sexually explicit content, or are illegal or infringe someone else&apos;s rights (for example using a real person&apos;s name or likeness without consent, or content involving minors). A declined credit submission gets its credit back.</li>
            <li>A domain that was declined before may be submitted again with a credit.</li>
          </ul>
        </section>
        <section>
          <h2>What credits do not buy</h2>
          <p>Paid and free listings get the same profile page, ranking and labels. There is no sponsored badge, and links to your site carry <code>rel=&quot;ugc&quot;</code> like every submitted listing. Credits do not buy placement in best-of lists, alternatives or comparisons. Listings stay up while the product works and its facts hold; see <Link href="/about/how-we-review">how we review</Link>.</p>
        </section>
        <section>
          <h2>Refunds</h2>
          <p>Unused credits can be refunded within 14 days of purchase. Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from the address on your account. When a payment is refunded or reversed through PayPal, the credits it bought are removed.</p>
        </section>
        <section>
          <h2>What we keep</h2>
          <ul>
            <li>Your Google account ID, email address and name, to sign you in and contact you about your listings.</li>
            <li>A sign-in cookie, and a random browser identifier kept in a cookie for two years.</li>
            <li>Salted, one-way hashes of the IP addresses and browser identifiers you use, to enforce one free submission per person. We do not store the raw values.</li>
            <li>Your purchases and credit history. PayPal processes payment details; we receive the payer email and amounts, never card numbers.</li>
          </ul>
          <p>We do not sell this data or use it for advertising. To close your account and delete what we hold, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>; payment records we must keep for tax are retained.</p>
        </section>
      </div>
    </main>
  );
}
