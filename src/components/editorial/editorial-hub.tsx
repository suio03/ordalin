import Link from "next/link";
import { EditorialCard } from "@/components/editorial/editorial-parts";
import type { EditorialKind } from "@/lib/editorial";
import { listLiveEditorial } from "@/lib/editorial/load";
import { listCategories } from "@/lib/repositories/catalog";
import catalogStyles from "@/components/directory/catalog-page.module.css";
import styles from "@/components/editorial/editorial.module.css";

export async function EditorialHub({ kind, eyebrow, title, intro }: {
  kind: EditorialKind;
  eyebrow: string;
  title: string;
  intro: string;
}) {
  const [{ pages, tools }, groups] = await Promise.all([listLiveEditorial(kind), listCategories()]);
  const byGroup = groups
    .map((group) => ({ group, pages: pages.filter((page) => page.groupSlug === group.slug) }))
    .filter((entry) => entry.pages.length);
  const known = new Set(groups.map((group) => group.slug));
  const ungrouped = pages.filter((page) => !known.has(page.groupSlug));

  return (
    <main className={`${catalogStyles.main} ${catalogStyles.wide}`}>
      <nav className={catalogStyles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
      </nav>
      <header className={styles.hubHeader}>
        <p className={catalogStyles.eyebrow}>{eyebrow}</p>
        <h1>{title}</h1>
        <p>{intro}</p>
      </header>
      {pages.length ? (
        <>
          {byGroup.map(({ group, pages: groupPages }) => (
            <section className={styles.hubGroup} key={group.slug} aria-labelledby={`hub-${group.slug}`}>
              <h2 id={`hub-${group.slug}`}>
                <Link href={`/categories/${group.slug}`}>{group.name}</Link>
              </h2>
              <div className={styles.cardGrid}>
                {groupPages.map((page) => <EditorialCard key={page.slug} page={page} tools={tools} />)}
              </div>
            </section>
          ))}
          {ungrouped.length ? (
            <section className={styles.hubGroup} aria-labelledby="hub-other">
              <h2 id="hub-other">More</h2>
              <div className={styles.cardGrid}>
                {ungrouped.map((page) => <EditorialCard key={page.slug} page={page} tools={tools} />)}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <p className={styles.empty}>
          Nothing is published here yet. <Link href="/tools">Browse all tools</Link> in the meantime.
        </p>
      )}
    </main>
  );
}
