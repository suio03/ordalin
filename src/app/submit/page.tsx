import type { Metadata } from "next";
import { SubmitFlow } from "@/components/submissions/submit-flow";
import {
  listSubmissionCategoryGroups,
  listSubmissionTags,
} from "@/lib/repositories/catalog";
import styles from "@/components/submissions/submit.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/submit" },
  title: "Submit a tool",
  description: "Check, confirm, and publish a new AI tool on Ordalin.",
};

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
          Ordalin gathers public facts and images. Edit anything, preview the complete profile, and publish when you are happy with it.
        </p>
      </header>
      {process.env.NODE_ENV === "development" ? <p role="status">Local preview uses production data in read-only mode. Submissions are disabled.</p> : <SubmitFlow
        categories={categories.map(({ slug, name, description }) => ({ slug, name, description }))}
        tags={tags}
        turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      />}
    </main>
  );
}
