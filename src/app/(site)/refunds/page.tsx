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
          <p className={styles.description}>A credit purchase can be refunded within 14 days if none of its credits has been used, and a declined credit submission always gets its credit back.</p>
        </div>
      </header>
      <div className={styles.prose}>
        <section>
          <h2>Refunds for unused purchases</h2>
          <ul>
            <li>Within 14 days of a purchase, if you have not used any of its credits, we refund the full amount to the PayPal account that paid, and the credits are removed.</li>
            <li>Once you have used a credit from a purchase, that purchase can no longer be refunded, including the credits left in it. For example, if you bought 3 credits for US$5.99 and used 1, the other 2 stay on your account to use later but are not refunded.</li>
            <li>A credit counts as used when you send a submission with it, whatever the review result.</li>
          </ul>
        </section>
        <section>
          <h2>Declined submissions</h2>
          <p>Credit submissions go live as soon as you publish them, and we check them afterwards. If we take one down because it breaks the listing rules, the credit goes back to your balance straight away, to use on another product. Credits do not expire, so this is a credit return, not a cash refund, and the purchase still counts as used.</p>
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
