import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DecisionGuide,
  EditorialDisclosure,
  EditorialHero,
  FactsTable,
  FaqSection,
  JsonLd,
  PickEntry,
  Prose,
  QuickPicks,
  RelatedEditorial,
} from "@/components/editorial/editorial-parts";
import { listRelatedEditorial } from "@/lib/editorial";
import { editorialStructuredData, loadEditorial } from "@/lib/editorial/load";
import { appBaseUrl, editorialMetadata } from "@/lib/editorial/metadata";
import { listEditorialTools, type EditorialTool } from "@/lib/repositories/catalog";
import catalogStyles from "@/components/directory/catalog-page.module.css";
import styles from "@/components/editorial/editorial.module.css";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const loaded = await loadEditorial("best", (await params).slug);
  return loaded ? editorialMetadata(loaded.page, loaded.indexable) : {};
}

export default async function BestPage({ params }: Params) {
  const loaded = await loadEditorial("best", (await params).slug);
  if (!loaded) notFound();
  const { page, tools, missing } = loaded;
  const picks = page.picks.filter((pick) => tools.has(pick.toolSlug));
  const related = listRelatedEditorial(page);
  const relatedTools = await listEditorialTools(related.flatMap((item) => item.kind === "compare" ? item.sides.map((side) => side.toolSlug) : item.picks.map((pick) => pick.toolSlug)));

  return (
    <main className={`${catalogStyles.main} ${catalogStyles.wide}`}>
      <JsonLd data={editorialStructuredData(page, tools, appBaseUrl())} />
      <EditorialHero page={page} missing={missing} />
      <div className={styles.layout}>
        <article className={styles.article}>
          <Prose paragraphs={page.intro} />

          {page.criteria.length ? (
            <section className={styles.section} aria-labelledby="criteria-title">
              <h2 id="criteria-title">How we chose</h2>
              <ul className={styles.criteria}>
                {page.criteria.map((item) => (
                  <li key={item.title}><strong>{item.title}</strong><span>{item.text}</span></li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className={styles.section} aria-labelledby="picks-title">
            <h2 id="picks-title">The {picks.length} picks</h2>
            <div className={styles.pickList}>
              {picks.map((pick, index) => (
                <PickEntry key={pick.toolSlug} pick={pick} tool={tools.get(pick.toolSlug)!} rank={index + 1} />
              ))}
            </div>
          </section>

          <section className={styles.section} aria-labelledby="compare-title">
            <h2 id="compare-title">Side by side</h2>
            <FactsTable
              caption="Facts from each tool's official website"
              tools={picks.map((pick) => tools.get(pick.toolSlug)).filter((tool): tool is EditorialTool => Boolean(tool))}
            />
          </section>

          <DecisionGuide rows={page.decisionGuide} tools={tools} />

          {page.closing.length ? (
            <section className={styles.section} aria-labelledby="closing-title">
              <h2 id="closing-title">Our take</h2>
              <Prose paragraphs={page.closing} />
            </section>
          ) : null}

          <FaqSection faq={page.faq} />
          <RelatedEditorial pages={related} tools={relatedTools} />
          <EditorialDisclosure />
        </article>
        <aside className={styles.aside}>
          <QuickPicks picks={page.picks} tools={tools} />
        </aside>
      </div>
    </main>
  );
}
