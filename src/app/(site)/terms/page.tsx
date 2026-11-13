import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/account/credits";
import styles from "@/components/directory/catalog-page.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/terms" },
  title: "Terms of service",
  description: "The terms for using Ordalin, signing in, submitting a tool and buying listing credits.",
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  const mail = <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>;
  return (
    <main className={styles.main}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Updated 13 November 2026</p>
          <h1>Terms of service</h1>
          <p className={styles.description}>These terms cover using ordalin.com, signing in, submitting a tool and buying listing credits. By using the site you agree to them.</p>
        </div>
      </header>
      <div className={styles.prose}>
        <section>
          <h2>Who we are</h2>
          <p>Ordalin (&ldquo;we&rdquo;, &ldquo;us&rdquo;) runs ordalin.com, a directory of AI tools. Contact us at {mail}. How we handle personal data is set out in our <Link href="/privacy">privacy policy</Link>, and refunds in our <Link href="/refunds">refund policy</Link>.</p>
        </section>
        <section>
          <h2>Using the directory</h2>
          <ul>
            <li>Browsing, searching and the free tools need no account.</li>
            <li>Tool profiles, prices, comparisons and guides are our research and opinion, checked against each product&apos;s own website when we write them. Products change; check the maker&apos;s site before you buy or rely on a tool. See <Link href="/about/how-we-review">how we review</Link>.</li>
            <li>Links to other sites are provided for convenience. We are not responsible for their content, products or terms.</li>
            <li>Do not scrape the site at a rate that degrades it, try to break its security, or use it for anything unlawful. We may block traffic that does.</li>
          </ul>
        </section>
        <section>
          <h2>Accounts</h2>
          <p>You sign in with Google to submit a tool or buy credits. One person may hold one account. You are responsible for activity on your account. We may close accounts used to get around the free-submission limit, to submit misleading listings, or to dispute payments that were delivered, and remove their credits.</p>
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
            <li>Credits never expire. One credit covers one submitted product. Credits cannot be transferred or exchanged for cash, except as a refund under our <Link href="/refunds">refund policy</Link>.</li>
            <li>Credit submissions are reviewed within 48 hours. Sites built on third-party models are accepted.</li>
            <li>We still decline submissions that are not an AI product, have no working product, show sexually explicit content, or are illegal or infringe someone else&apos;s rights (for example using a real person&apos;s name or likeness without consent, or content involving minors). A declined credit submission gets its credit back.</li>
            <li>A domain that was declined before may be submitted again with a credit.</li>
          </ul>
        </section>
        <section>
          <h2>What credits do not buy</h2>
          <p>Paid and free listings get the same profile page, ranking and labels. There is no sponsored badge, and links to your site carry <code>rel=&quot;ugc&quot;</code> like every submitted listing. Credits do not buy placement in best-of lists, alternatives or comparisons. Listings stay up while the product works and its facts hold; we may edit, relabel or remove a listing whose product stops working, changes materially or breaks these terms.</p>
        </section>
        <section>
          <h2>Content you submit</h2>
          <p>You must have the right to submit the name, description, logo and images you send us, and they must be accurate. You keep ownership of them and give us a worldwide, royalty-free licence to publish, edit, crop and translate them on Ordalin and in material that promotes Ordalin. We also capture screenshots of your public website for the listing.</p>
        </section>
        <section>
          <h2>Our content</h2>
          <p>The site&apos;s text, design and data are ours or our licensors&apos;. You may quote and link to them with attribution. Code we publish on GitHub is covered by the licence in that repository. Third-party names and logos belong to their owners and appear only to identify their products.</p>
        </section>
        <section>
          <h2>No warranty and limits on liability</h2>
          <p>We work to keep listings accurate, but the site and free tools are provided &ldquo;as is&rdquo;, without guarantees that they are complete, current or error-free, or that a listing will bring traffic or sales. To the extent the law allows, we are not liable for indirect or consequential loss, and our total liability to you for any claim is limited to the amount you paid us in the 12 months before it.</p>
          <p>Nothing in these terms excludes rights you have under the Australian Consumer Law or other consumer laws that cannot be excluded.</p>
        </section>
        <section>
          <h2>Changes and governing law</h2>
          <p>We may update these terms; the date at the top shows the latest version, and continuing to use the site after a change means you accept it. Changes do not reduce the value of credits you already hold. These terms are governed by the laws of Australia.</p>
        </section>
      </div>
    </main>
  );
}
