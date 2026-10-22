import type { Metadata } from "next";
import Link from "next/link";
import { withSocial } from "@/lib/seo";
import { listToolIndex, type ToolIndexEntry } from "@/lib/repositories/catalog";
import catalogStyles from "@/components/directory/catalog-page.module.css";
import styles from "./a-z.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = withSocial({
  title: "All AI tools A–Z",
  description: "Every published AI tool on Ordalin in alphabetical order, with its category, on one page.",
  alternates: { canonical: "/tools/a-z" },
});

const letters = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "#"];

// Names starting with a digit or symbol share the "#" section.
function letterOf(name: string) {
  const first = name.trim().charAt(0).toUpperCase();
  return first >= "A" && first <= "Z" ? first : "#";
}

function sectionId(letter: string) {
  return letter === "#" ? "other" : letter.toLowerCase();
}

export default async function ToolIndexPage() {
  const tools = await listToolIndex();
  const sections = new Map<string, ToolIndexEntry[]>();
  for (const tool of tools) {
    const letter = letterOf(tool.name);
    sections.set(letter, [...(sections.get(letter) ?? []), tool]);
  }

  return (
    <main className={`${catalogStyles.main} ${catalogStyles.wide}`}>
      <nav className={catalogStyles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span>
        <Link href="/tools">All tools</Link>
      </nav>
      <header className={catalogStyles.pageHeader}>
        <div>
          <p className={catalogStyles.eyebrow}>Catalogue index</p>
          <h1>All AI tools A–Z</h1>
          <p className={catalogStyles.description}>
            Every published tool on one page. Use the{" "}
            <Link href="/tools">catalogue</Link> to filter by category and pricing.
          </p>
        </div>
        <p className={catalogStyles.count}>{tools.length} tools</p>
      </header>

      <nav className={styles.letters} aria-label="Jump to letter">
        {letters.map((letter) =>
          sections.has(letter) ? (
            <a key={letter} href={`#${sectionId(letter)}`}>{letter}</a>
          ) : (
            <span key={letter} aria-hidden="true">{letter}</span>
          ),
        )}
      </nav>

      {letters.filter((letter) => sections.has(letter)).map((letter) => (
        <section className={styles.section} id={sectionId(letter)} key={letter} aria-labelledby={`${sectionId(letter)}-title`}>
          <h2 id={`${sectionId(letter)}-title`}>{letter === "#" ? "0–9 and symbols" : letter}</h2>
          <ul>
            {sections.get(letter)!.map((tool) => (
              <li key={tool.slug}>
                <Link href={`/tools/${tool.slug}`}>{tool.name}</Link>
                <span>{tool.categoryName}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
