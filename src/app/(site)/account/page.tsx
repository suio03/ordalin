import type { Metadata } from "next";
import Link from "next/link";
import { BuyCredits } from "@/components/account/buy-credits";
import { getCloudflareEnv } from "@/lib/cloudflare";
import { currentAccount } from "@/lib/account/current";
import { SUPPORT_EMAIL, listAccountSubmissions, listLedger, packSummary, type AccountSubmission, type LedgerEntry } from "@/lib/account/credits";
import { explainDecline } from "@/lib/submissions/decline-reasons";
import styles from "@/components/account/account.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your account",
  alternates: { canonical: "/account" },
  robots: { index: false, follow: false },
};

const LEDGER_LABELS: Record<string, string> = {
  purchase: "Purchased",
  spend: "Used for a submission",
  refund_rejected: "Returned · submission declined",
  refund_failed: "Returned · submission did not go through",
  reversal: "Removed · payment refunded",
  adjustment: "Adjustment",
};

const SUBMISSION_STATUS: Record<string, string> = {
  pending: "In review",
  accepted: "Listed",
  rejected: "Declined",
  duplicate: "Already listed",
};

const FREE_STATUS = {
  available: "Free submission available",
  used: "Free submission used",
  linked: "Free submission already used from this browser or network",
} as const;

const date = (seconds: number) => new Date(seconds * 1000).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

// Local preview cannot sign in (development is read-only), so it shows sample data.
const PREVIEW = {
  account: { user: { id: "preview", email: "preview@example.com", emailNormalized: "preview@example.com", name: "Preview" }, balance: 2, free: "used" as const },
  ledger: [
    { delta: -1, kind: "spend", reference: "submission_preview", createdAt: 1_794_096_000 },
    { delta: 3, kind: "purchase", reference: "capture_preview", createdAt: 1_794_009_600 },
  ] satisfies LedgerEntry[],
  submissions: [
    { name: "Voice Studio", domain: "voicestudio.example", status: "pending", funding: "credit", createdAt: 1_794_096_000, toolSlug: null, moderationNote: null },
    { name: "Chat Mirror", domain: "chatmirror.example", status: "rejected", funding: "free", createdAt: 1_793_923_200, toolSlug: null, moderationNote: JSON.stringify({ reason: "wrapper", note: "The chat runs on a third-party model API with no added workflow." }) },
  ] satisfies AccountSubmission[],
};

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ signin?: string | string[] }> }) {
  const { signin } = await searchParams;
  const development = process.env.NODE_ENV === "development";
  const env = (await getCloudflareEnv()) as CloudflareEnv & { PAYPAL_CLIENT_ID?: string };
  const account = development ? PREVIEW.account : await currentAccount();

  if (!account) {
    return (
      <main className={styles.main}>
        <header className={styles.intro}>
          <p className={styles.eyebrow}>Account</p>
          <h1>Sign in to see your credits.</h1>
          <p>Credits cost {packSummary()}, never expire, and each one lists one product. Your first submission is free.</p>
        </header>
        {signin ? <p className={styles.error} role="alert">Google sign-in did not complete. Please try again.</p> : null}
        {/* OAuth starts on an API route, so it needs a full page navigation. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className={styles.primary} href="/api/auth/google?next=/account">Continue with Google →</a>
      </main>
    );
  }

  const [ledger, submissions] = development
    ? [PREVIEW.ledger, PREVIEW.submissions]
    : await Promise.all([listLedger(env.DB, account.user.id), listAccountSubmissions(env.DB, account.user.id)]);

  return (
    <main className={styles.main}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>Account · {account.user.email}</p>
        <h1>{account.balance} {account.balance === 1 ? "credit" : "credits"}</h1>
        <p>{FREE_STATUS[account.free]}. Credits never expire; each one lists one product.</p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/submit">Submit a tool →</Link>
          <form action="/api/auth/logout" method="post"><button className={styles.secondary} type="submit">Sign out</button></form>
        </div>
      </header>

      <section className={styles.panel} aria-labelledby="buy-title">
        <div>
          <h2 id="buy-title">Buy credits</h2>
          <p>Paid once through PayPal. Reviewed within 48 hours, credit returned if a submission is declined, unused credits refundable within 14 days. <Link href="/refunds">Refund policy</Link></p>
        </div>
        {development ? <p className={styles.notice}>Payments are disabled in local preview.</p> : <BuyCredits clientId={env.PAYPAL_CLIENT_ID ?? null} />}
      </section>

      <section className={styles.panel} aria-labelledby="submissions-title">
        <h2 id="submissions-title">Your submissions</h2>
        {submissions.length ? (
          <ul className={styles.rows}>
            {submissions.map((item) => {
              const decline = item.status === "rejected" ? explainDecline(item.moderationNote) : null;
              return (
                <li key={`${item.domain}-${item.createdAt}`}>
                  <span>
                    <strong>{item.toolSlug && item.status === "accepted" ? <Link href={`/tools/${item.toolSlug}`}>{item.name}</Link> : item.name}</strong>
                    <small>{item.domain} · {item.funding === "credit" ? "Credit" : "Free"} · {date(item.createdAt)}</small>
                    {decline ? (
                      <span className={styles.decline}>
                        Why: {decline.text}{decline.note ? ` ${decline.note}` : ""}
                        {decline.creditCanList && item.funding === "free" ? <> Credit submissions accept sites built on third-party models, so you can submit it again with a credit. <Link href="/submit" prefetch={false}>Submit again</Link></> : null}
                        {" "}Questions: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                      </span>
                    ) : null}
                  </span>
                  <span className={styles.badge} data-status={item.status}>{SUBMISSION_STATUS[item.status] ?? item.status}</span>
                </li>
              );
            })}
          </ul>
        ) : <p className={styles.empty}>No submissions yet.</p>}
      </section>

      <section className={styles.panel} aria-labelledby="ledger-title">
        <h2 id="ledger-title">Credit history</h2>
        {ledger.length ? (
          <ul className={styles.rows}>
            {ledger.map((entry) => (
              <li key={`${entry.kind}-${entry.reference}`}>
                <span><strong>{LEDGER_LABELS[entry.kind] ?? entry.kind}</strong><small>{date(entry.createdAt)}</small></span>
                <span className={styles.delta}>{entry.delta > 0 ? `+${entry.delta}` : entry.delta}</span>
              </li>
            ))}
          </ul>
        ) : <p className={styles.empty}>No credits yet.</p>}
      </section>
    </main>
  );
}
