import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/account/credits";
import styles from "@/components/directory/catalog-page.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  title: "Privacy policy",
  description: "What personal data Ordalin collects, why, who processes it and how to have it deleted.",
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  const mail = <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>;
  return (
    <main className={styles.main}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Updated 13 November 2026</p>
          <h1>Privacy policy</h1>
          <p className={styles.description}>Ordalin collects as little as it can. Browsing needs no account and sets no tracking cookies; we keep personal data only when you sign in, submit a tool or buy credits.</p>
        </div>
      </header>
      <div className={styles.prose}>
        <section>
          <h2>When you browse</h2>
          <ul>
            <li><strong>Analytics.</strong> We count visits with a self-hosted Plausible instance. It sets no cookies and does not store IP addresses or build profiles of individual visitors; we see totals such as page views, referrers and countries.</li>
            <li><strong>Hosting and security.</strong> The site runs on Cloudflare, which processes your IP address and request details to deliver pages and block abuse.</li>
            <li><strong>Theme.</strong> Your light or dark choice is saved in your browser&apos;s local storage and never sent to us.</li>
            <li><strong>Free tools.</strong> Image tools such as circle crop work inside your browser; your images are not uploaded. Tools that check a website fetch the URL you enter from our server and do not store your details.</li>
          </ul>
        </section>
        <section>
          <h2>When you sign in</h2>
          <ul>
            <li>Google sign-in gives us your Google account ID, email address and name (scopes <code>openid email profile</code>). We use them to sign you in and to contact you about your listings and purchases. We get no access to your Gmail, Drive or other Google data.</li>
            <li>A sign-in cookie keeps you signed in for up to 60 days. A random browser identifier is kept in a cookie for two years.</li>
            <li>To enforce one free submission per person, we store salted, one-way hashes of the IP addresses and browser identifiers you use. We do not store the raw values.</li>
          </ul>
        </section>
        <section>
          <h2>When you submit a tool</h2>
          <ul>
            <li>We keep what you send: the tool&apos;s name, website, description, category, images and your contact email.</li>
            <li>Cloudflare Turnstile checks that you are a person; it processes browser signals under Cloudflare&apos;s privacy policy.</li>
            <li>To draft the listing we read the tool&apos;s public website and send that text to OpenAI&apos;s API with a hashed identifier, never your name or email. OpenAI does not use API data to train its models.</li>
          </ul>
        </section>
        <section>
          <h2>When you buy credits</h2>
          <p>Payments are handled by PayPal. We receive the order and payment IDs, the payer email, the amount and the payment status; we never see card or bank details. We keep your credit history so your balance stays correct.</p>
        </section>
        <section>
          <h2>Who processes data for us</h2>
          <p>Cloudflare (hosting, database, file storage, Turnstile), Google (sign-in), PayPal (payments), OpenAI (drafting listings) and Fastmail (our support email). They may process data outside your country, including in the United States. We do not sell personal data or use it for advertising.</p>
        </section>
        <section>
          <h2>How long we keep it</h2>
          <ul>
            <li>Account data, submissions and credit history: while your account is open.</li>
            <li>Rate-limit records: deleted automatically after a short window. Network hashes used for the free-submission check look back 90 days.</li>
            <li>Payment records: as long as tax and accounting law requires, even after an account is closed.</li>
            <li>Published listings describe products, not people, and stay up under our <Link href="/terms">terms</Link>.</li>
          </ul>
        </section>
        <section>
          <h2>Your choices and rights</h2>
          <p>You can ask for a copy of your data, a correction, or deletion of your account by emailing {mail} from the address on your account. We reply within 30 days. If you are unhappy with our answer you may complain to your local privacy regulator; in Australia that is the OAIC.</p>
          <p>Ordalin is not meant for children under 16, and we do not knowingly collect their data.</p>
        </section>
        <section>
          <h2>Changes</h2>
          <p>We will update the date at the top when this policy changes, and email account holders about material changes.</p>
        </section>
      </div>
    </main>
  );
}
