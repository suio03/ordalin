import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import { SubmitFlow } from "@/components/submissions/submit-flow";
import { previewDraft } from "@/components/submissions/submit-preview-fixture";
import {
  listSubmissionCategoryGroups,
  listSubmissionTags,
} from "@/lib/repositories/catalog";
import styles from "@/components/submissions/submit.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = withSocial({
  alternates: { canonical: "/submit" },
  title: "Submit a tool",
  description: "Check, confirm, and submit a new AI tool to Ordalin.",
});

export default async function SubmitPage() {
  const [categories, tags] = await Promise.all([
    listSubmissionCategoryGroups(),
    listSubmissionTags(),
  ]);
  return (
    <main className={styles.main}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>Free submission</p>
        <h1>Start with the official website.</h1>
        <p>
          Ordalin drafts a profile from public facts and images. Check each part, correct anything that is wrong, then submit it. We research every tool before it goes live.
        </p>
      </header>
      {process.env.NODE_ENV === "development" ? <p role="status">Local preview shows a sample draft in read-only mode. Submissions are disabled.</p> : null}
      <SubmitFlow
        categories={categories.map(({ slug, name, description }) => ({ slug, name, description }))}
        tags={tags}
        turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        initialDraft={process.env.NODE_ENV === "development" ? previewDraft(categories, tags) : undefined}
      />
    </main>
  );
}
