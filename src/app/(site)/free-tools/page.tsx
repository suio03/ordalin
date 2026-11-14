import type { Metadata } from "next";
import Link from "next/link";
import {
  freeToolGroups,
  freeToolPath,
  freeTools,
  freeToolsHubPath,
} from "@/lib/free-tools/registry";
import { hubLanguages } from "@/lib/free-tools/image-shape/pages";
import { withSocial } from "@/lib/seo";
import styles from "@/app/(site)/guides/guides.module.css";
import hub from "./free-tools.module.css";

export const metadata: Metadata = withSocial({
  title: "Free tools",
  description:
    "Free Ordalin tools for checking how AI search sees a website, cropping, squaring and flipping images, and removing the metadata that gets images labelled as AI. No sign-up.",
  alternates: {
    canonical: freeToolsHubPath,
    languages: hubLanguages,
  },
});

export default function FreeToolsPage() {
  return (
    <main className={styles.main}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span>Free tools</span>
      </nav>

      <header className={styles.indexHeader}>
        <div>
          <p className={styles.eyebrow}>Ordalin free tools</p>
          <h1>Free tools for AI search and images.</h1>
          <p>
            Each tool runs for free with no sign-up. Image tools work in your
            browser, so files are never uploaded.
          </p>
        </div>
        <p className={styles.issueCount}>{freeTools.length} tools</p>
      </header>

      {freeToolGroups.map((group) => {
        const tools = freeTools.filter((tool) => tool.group === group.id);
        if (!tools.length) return null;
        return (
          <section
            className={hub.group}
            aria-labelledby={`group-${group.id}`}
            key={group.id}
          >
            <div className={hub.groupHeader}>
              <h2 id={`group-${group.id}`}>{group.title}</h2>
              <p>{group.intro}</p>
            </div>
            <div className={styles.guideGrid}>
              {tools.map((tool, index) => (
                <Link
                  className={`${styles.guideCard} ${hub.card}`}
                  href={freeToolPath(tool.slug)}
                  key={tool.slug}
                >
                  <span className={styles.cardNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>{tool.name}</h3>
                    <p>{tool.summary}</p>
                  </div>
                  <span className={styles.cardAction}>Open tool →</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
