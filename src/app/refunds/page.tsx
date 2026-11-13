import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/account/credits";
import styles from "@/components/directory/catalog-page.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/refunds" },
  title: "Refund policy",
  description: "When Ordalin listing credits are refunded or returned, and how to ask for a refund.",
  robots: { index: false, follow: true },
};

export default function RefundsPage() {
  const mail = <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>;
  return (
    <main className={styles.main}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Updated 13 November 2026</p>
          <h1>Refund policy</h1>
          <p className={styles.description}>Unused listing credits can be refunded within 14 days of purchase, and a declined credit submission always gets its credit back.</p>
        </div>
      </header>
      <div className={styles.prose}>
        <section>
          <h2>Unused credits</h2>
          <ul>
            <li>Within 14 days of purchase, we refund credits you have not spent, to the PayPal account that paid.</li>
            <li>If you have spent part of a pack, we refund the unspent share of what you paid. For example, if you bought 3 credits for US$5.99 and used 1, we refund US$3.99 (two thirds), and the remaining 2 credits are removed.</li>
            <li>Spent credits are not refunded once the submission has been reviewed, whether it was published or declined.</li>
          </ul>
        </section>
        <section>
          <h2>Declined submissions</h2>
          <p>If we decline a credit submission, the credit goes back to your balance straight away, to use on another product. Credits do not expire, so this is a credit return, not a cash refund; within the 14 days you can still ask for that credit to be refunded as an unused one.</p>
        </section>
        <section>
          <h2>Late reviews</h2>
          <p>Credit submissions are reviewed within 48 hours. If we miss that, tell us and we will refund the credit for that submission on request, even after 14 days.</p>
        </section>
        <section>
          <h2>How to ask</h2>
          <p>Email {mail} from the address on your account with the date of the purchase. We process approved refunds through PayPal within 5 business days; PayPal decides how quickly the money reaches you.</p>
        </section>
        <section>
          <h2>PayPal refunds and disputes</h2>
          <p>When a payment is refunded or reversed through PayPal, including a dispute or chargeback, the credits it bought are removed from your balance. Please contact us before opening a dispute; we can usually sort it out faster. Accounts that dispute payments for credits already delivered may be closed under our <Link href="/terms">terms</Link>.</p>
        </section>
        <section>
          <h2>Your consumer rights</h2>
          <p>This policy does not limit rights you have under the Australian Consumer Law or other consumer laws, such as a remedy when a service is not delivered as described.</p>
        </section>
      </div>
    </main>
  );
}
