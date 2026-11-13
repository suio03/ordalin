import type { Metadata } from "next";
import Link from "next/link";
import { withSocial } from "@/lib/seo";
import { SubmitFlow, type SubmitAccount } from "@/components/submissions/submit-flow";
import { previewDraft } from "@/components/submissions/submit-preview-fixture";
import { currentAccount } from "@/lib/account/current";
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

// Local preview cannot sign in (development is read-only), so it uses a sample account.
const PREVIEW_ACCOUNT: SubmitAccount = { email: "preview@example.com", balance: 2, free: "available" };

type SearchParams = Promise<{ website?: string | string[] }>;

export default async function SubmitPage({ searchParams }: { searchParams: SearchParams }) {
  const { website } = await searchParams;
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
        <p className={styles.accountBar}>
          <span>Signed in as {account.email} · {account.balance} {account.balance === 1 ? "credit" : "credits"}{account.free === "available" ? " · free submission available" : ""}</span>
          <Link href="/account" prefetch={false}>Credits and submissions →</Link>
        </p>
      ) : null}
      <SubmitFlow
        account={account}
        categories={categories.map(({ slug, name, description }) => ({ slug, name, description }))}
        tags={tags}
        turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        initialWebsite={initialWebsite}
        initialDraft={development ? previewDraft(categories, tags) : undefined}
      />
    </main>
  );
}
