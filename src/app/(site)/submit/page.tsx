import type { Metadata } from "next";
import Link from "next/link";
import { withSocial } from "@/lib/seo";
import { SubmitFlow, type SubmitAccount } from "@/components/submissions/submit-flow";
import { previewDraft } from "@/components/submissions/submit-preview-fixture";
import { currentAccount } from "@/lib/account/current";
import { packSummary } from "@/lib/account/credits";
import {
  listSubmissionCategoryGroups,
  listSubmissionTags,
} from "@/lib/repositories/catalog";
import styles from "@/components/submissions/submit.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = withSocial({
  alternates: { canonical: "/submit" },
  title: "Submit a tool",
  description: "Submit an AI tool to Ordalin. Your first submission is free; credits start at $3.99 and never expire.",
});

const SIGN_IN_MESSAGES: Record<string, string> = {
  unavailable: "Google sign-in is not available right now. Please try again later.",
  failed: "Google sign-in did not complete. Please try again.",
  unverified: "This Google account has no verified email address.",
  blocked: "This account cannot submit tools. Contact Ordalin if you think this is a mistake.",
};

// Local preview cannot sign in (development is read-only), so it uses a sample account.
const PREVIEW_ACCOUNT: SubmitAccount = { email: "preview@example.com", balance: 2, free: "available" };

type SearchParams = Promise<{ website?: string | string[]; signin?: string | string[] }>;

export default async function SubmitPage({ searchParams }: { searchParams: SearchParams }) {
  const { website, signin } = await searchParams;
  const development = process.env.NODE_ENV === "development";
  const [categories, tags, signedIn] = await Promise.all([
    listSubmissionCategoryGroups(),
    listSubmissionTags(),
    development ? null : currentAccount(),
  ]);
  const account: SubmitAccount | null = development
    ? PREVIEW_ACCOUNT
    : signedIn && { email: signedIn.user.email, balance: signedIn.balance, free: signedIn.free };
  const initialWebsite = typeof website === "string" ? website.slice(0, 2_048) : "";
  const signInMessage = typeof signin === "string" ? SIGN_IN_MESSAGES[signin] : undefined;
  return (
    <main className={styles.main}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>First submission free · credits from $3.99</p>
        <h1>Start with the official website.</h1>
        <p>
          Ordalin drafts a profile from public facts and images. Check each part, correct anything that is wrong, then submit it. We research every tool before it goes live.
        </p>
      </header>
      {development ? <p role="status">Local preview shows a sample draft and account in read-only mode. Submissions are disabled.</p> : null}
      {account ? (
        <>
          <p className={styles.accountBar}>
            <span>Signed in as {account.email} · {account.balance} {account.balance === 1 ? "credit" : "credits"}{account.free === "available" ? " · free submission available" : ""}</span>
            <Link href="/account">Credits and submissions →</Link>
          </p>
          <SubmitFlow
            account={account}
            categories={categories.map(({ slug, name, description }) => ({ slug, name, description }))}
            tags={tags}
            turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            initialWebsite={initialWebsite}
            initialDraft={development ? previewDraft(categories, tags) : undefined}
          />
        </>
      ) : (
        <section className={styles.signIn} aria-labelledby="signin-title">
          <div>
            <h2 id="signin-title">Sign in to submit</h2>
            <p>Use a Google account so we can reach you about your listing and keep track of your free submission and credits.</p>
            {signInMessage ? <p className={styles.error} role="alert">{signInMessage}</p> : null}
            {/* OAuth starts on an API route, so it needs a full page navigation. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a className={styles.signInButton} href="/api/auth/google?next=/submit">Continue with Google →</a>
          </div>
          <div className={styles.stageNotes}>
            <p><span>01</span> Your first submission is free and goes through our strict review.</p>
            <p><span>02</span> Credits cost {packSummary()}, never expire, and each one lists one product within 48 hours.</p>
            <p><span>03</span> A declined credit submission gets its credit back. <Link href="/terms">Terms</Link></p>
          </div>
        </section>
      )}
    </main>
  );
}
