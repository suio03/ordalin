import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { CreditPicker } from "@/components/account/credit-picker";
import { SUPPORT_EMAIL } from "@/lib/account/credits";
import { withSocial } from "@/lib/seo";
import styles from "@/components/account/pricing.module.css";

export const metadata: Metadata = withSocial({
  alternates: { canonical: "/pricing" },
  title: "Pricing: list your AI tool",
  description: "Your first Ordalin submission is free. After that, listing credits cost $3.99 for 1, $5.99 for 3 or $9.99 for 10, paid once through PayPal, and never expire.",
});

const FAQ = [
  { q: "What does one credit pay for?", a: "One credit lists one product. It covers the review and the listing page; there is no monthly fee and nothing to renew." },
  { q: "Do credits expire?", a: "No. Credits stay on your account until you use them, and a later price change does not affect credits you already bought." },
  { q: "What happens if my submission is declined?", a: "A declined credit submission gets its credit back straight away, and your account page shows the reason. A declined free submission is not returned." },
  { q: "Can I get a refund?", a: "Within 14 days of buying, if you have not used any of the credits, we refund the purchase in full. Once a credit from a purchase is used, that purchase is no longer refundable." },
  { q: "How do I pay?", a: "Through PayPal, with a PayPal balance or a card. It is a one-time payment; we never store card details." },
  { q: "Is a paid listing labelled or ranked differently?", a: "No. Free and credit listings get the same page, the same ranking and the same labels, and both are open to search engines." },
];

const NEVER = [
  { title: "Not an AI tool", text: "Agencies, courses, newsletters and products without AI at their core." },
  { title: "Down or waitlist only", text: "Sites that do not load, or have nothing to use yet." },
  { title: "Sexually explicit", text: "Adult content and anything sexualising minors." },
  { title: "Illegal or infringing", text: "Using someone else’s name, likeness or content without permission." },
];

const Icon = {
  check: <path d="M4.5 10.5l3.5 3.5 7.5-8" />,
  layers: <path d="M10 3l7 4-7 4-7-4 7-4zM3 11l7 4 7-4" />,
  search: <><circle cx="9" cy="9" r="5" /><path d="M13 13l4 4" /></>,
  calendar: <><rect x="3" y="4.5" width="14" height="12.5" rx="2" /><path d="M3 8.5h14M7 3v3M13 3v3" /></>,
  card: <><rect x="2.5" y="5" width="15" height="10.5" rx="2" /><path d="M2.5 8.5h15M5.5 12.5h3" /></>,
  ban: <><circle cx="10" cy="10" r="7" /><path d="M5 5l10 10" /></>,
  mail: <><rect x="2.5" y="4.5" width="15" height="11" rx="2" /><path d="M3 5.5l7 5.5 7-5.5" /></>,
};

function Svg({ children, className }: { children: ReactNode; className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">{children}</svg>;
}

function Features({ items }: { items: string[] }) {
  return (
    <ul className={styles.features}>
      {items.map((item) => <li key={item}><Svg className={styles.check}>{Icon.check}</Svg>{item}</li>)}
    </ul>
  );
}

export default function PricingPage() {
  return (
    <main className={styles.main}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>Pricing</p>
        <h1>List your AI tool on Ordalin</h1>
        <p>Your first submission is free. After that, pay once for listing credits. No subscription, and credits never expire.</p>
      </header>

      <section className={styles.plans} aria-label="Plans">
        <article className={styles.plan}>
          <header>
            <h2>Free</h2>
            <p>Your first product, under our standard review.</p>
          </header>
          <p className={styles.price}><strong>$0</strong><span>one per person</span></p>
          <p className={styles.note}>Free listings get the same page and ranking as paid ones. Used your free submission already? Credits start at $3.99.</p>
          <Features items={["For tools from the company that builds them", "Standard review; model wrappers and resellers declined", "A declined free submission is not returned"]} />
          <Link className={styles.secondary} href="/submit">Submit a tool</Link>
        </article>

        <article className={styles.plan} data-featured="">
          <header>
            <h2>Listing credits</h2>
            <p>Pay once, use whenever you launch something new.</p>
          </header>
          <CreditPicker features={<Features items={["Reviewed within 48 hours", "Sites built on third-party models accepted", "Credit back if declined", "Credits never expire"]} />} />
        </article>
      </section>

      <section className={styles.facts} aria-label="Included with every listing">
        <div><Svg>{Icon.layers}</Svg><p><strong>Same listing either way</strong>Free and paid tools get the same page, ranking and labels.</p></div>
        <div><Svg>{Icon.search}</Svg><p><strong>Open to search engines</strong>Every listing is indexed, with no sponsored tag.</p></div>
        <div><Svg>{Icon.calendar}</Svg><p><strong>Credits never expire</strong>Use them whenever you launch something new.</p></div>
        <div><Svg>{Icon.card}</Svg><p><strong>One-time PayPal payment</strong>Pay with a balance or a card. We never store card details.</p></div>
      </section>

      <section className={styles.section} aria-labelledby="declined-title">
        <div className={styles.sectionHead}>
          <h2 id="declined-title">What we never list</h2>
          <p>Paid or free, these are declined. <Link href="/about/how-we-review">How we review</Link></p>
        </div>
        <ul className={styles.never}>
          {NEVER.map((item) => (
            <li key={item.title}><Svg>{Icon.ban}</Svg><strong>{item.title}</strong><span>{item.text}</span></li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="faq-title">
        <div className={styles.sectionHead}>
          <h2 id="faq-title">Questions</h2>
          <p>Full details are in the <Link href="/terms">terms</Link> and <Link href="/refunds">refund policy</Link>.</p>
        </div>
        <dl className={styles.faq}>
          {FAQ.map((item) => <div key={item.q}><dt>{item.q}</dt><dd>{item.a}</dd></div>)}
        </dl>
        <a className={styles.contact} href={`mailto:${SUPPORT_EMAIL}`}>
          <Svg>{Icon.mail}</Svg>
          <span><strong>Something else?</strong>Email {SUPPORT_EMAIL} and we will reply.</span>
        </a>
      </section>
    </main>
  );
}
