import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ToolMark } from "@/components/directory/tool-mark";
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
  pricingLabel,
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
  const loaded = await loadEditorial("alternatives", (await params).slug);
  return loaded ? editorialMetadata(loaded.page, loaded.indexable) : {};
}

export default async function AlternativesPage({ params }: Params) {
  const loaded = await loadEditorial("alternatives", (await params).slug);
  if (!loaded) notFound();
  const { page, tools, missing } = loaded;
  const anchor = tools.get(page.anchorSlug);
  const picks = page.picks.filter((pick) => tools.has(pick.toolSlug));
  const related = listRelatedEditorial(page);
  const relatedTools = await listEditorialTools(related.flatMap((item) => item.kind === "compare" ? item.sides.map((side) => side.toolSlug) : item.picks.map((pick) => pick.toolSlug)));
  const tableTools = [anchor, ...picks.map((pick) => tools.get(pick.toolSlug))]
    .filter((tool): tool is EditorialTool => Boolean(tool));

  return (
    <main className={`${catalogStyles.main} ${catalogStyles.wide}`}>
      <JsonLd data={editorialStructuredData(page, tools, appBaseUrl())} />
      <EditorialHero page={page} missing={missing}>
        {anchor ? (
          <div className={styles.anchor}>
            <ToolMark name={anchor.name} logoAssetKey={anchor.logoAssetKey} />
            <p>
              Replacing <Link href={`/tools/${anchor.slug}`}>{anchor.name}</Link>
              {" · "}{pricingLabel(anchor)}
            </p>
          </div>
        ) : null}
      </EditorialHero>
      <div className={styles.layout}>
        <article className={styles.article}>
          <Prose paragraphs={page.intro} />

          <section className={styles.section} aria-labelledby="switch-title">
            <h2 id="switch-title">Why people look for an alternative</h2>
            <ul className={styles.criteria}>
              {page.whySwitch.map((reason) => <li key={reason}><span>{reason}</span></li>)}
            </ul>
          </section>

          <section className={styles.section} aria-labelledby="picks-title">
            <h2 id="picks-title">{picks.length} alternatives worth considering</h2>
            <div className={styles.pickList}>
              {picks.map((pick, index) => (
                <PickEntry key={pick.toolSlug} pick={pick} tool={tools.get(pick.toolSlug)!} rank={index + 1} />
              ))}
            </div>
          </section>

          <section className={styles.section} aria-labelledby="compare-title">
            <h2 id="compare-title">Compared with {anchor?.name ?? "the original"}</h2>
            <FactsTable caption="Facts from each tool's official website" tools={tableTools} />
          </section>

          <DecisionGuide rows={page.decisionGuide} tools={tools} />
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
