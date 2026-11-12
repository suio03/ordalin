import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import Link from "next/link";
import { ToolList } from "@/components/directory/tool-list";
import { indexableModelsMinimum, modelTagSlug } from "@/lib/catalog";
import { listPublishedTools } from "@/lib/repositories/catalog";
import styles from "@/components/directory/catalog-page.module.css";

export const dynamic = "force-dynamic";

const listModels = () => listPublishedTools({ tagSlug: modelTagSlug, pageSize: 48 });

export async function generateMetadata(): Promise<Metadata> {
  const models = await listModels();
  return withSocial({
    title: "AI models",
    description: "Generative and foundation AI models you can use through an API or playground, with pricing, limits and capabilities checked against official documentation.",
    alternates: { canonical: "/models" },
    robots: models.total >= indexableModelsMinimum ? undefined : { index: false, follow: true },
  });
}

export default async function ModelsPage() {
  const models = await listModels();
  return (
    <main className={`${styles.main} ${styles.wide}`}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/tools">All tools</Link>
      </nav>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Models</p>
          <h1>AI models</h1>
          <p className={styles.description}>
            The models behind the apps: what each one generates, how it is priced per
            second, image or token, and what its official documentation says it cannot do yet.
          </p>
        </div>
        <p className={styles.count}>{models.total} {models.total === 1 ? "model" : "models"}</p>
      </header>
      <section className={styles.panel} aria-label="AI models">
        <ToolList tools={models.items} emptyMessage="No models are listed yet." />
      </section>
    </main>
  );
}
