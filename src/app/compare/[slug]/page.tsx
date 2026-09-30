import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ToolMark } from "@/components/directory/tool-mark";
import {
  EditorialDisclosure,
  EditorialHero,
  FactsTable,
  FaqSection,
  JsonLd,
  Prose,
  RelatedEditorial,
  checkedLabel,
} from "@/components/editorial/editorial-parts";
import { listRelatedEditorial } from "@/lib/editorial";
import { editorialStructuredData, loadEditorial } from "@/lib/editorial/load";
import { appBaseUrl, editorialMetadata } from "@/lib/editorial/metadata";
import { catalogWebsiteOutboundUrl, catalogWebsiteRel } from "@/lib/catalog-links";
import { listEditorialTools, type EditorialTool } from "@/lib/repositories/catalog";
import catalogStyles from "@/components/directory/catalog-page.module.css";
import styles from "@/components/editorial/editorial.module.css";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const loaded = await loadEditorial("compare", (await params).slug);
  return loaded ? editorialMetadata(loaded.page, loaded.indexable) : {};
}

export default async function ComparePage({ params }: Params) {
  const loaded = await loadEditorial("compare", (await params).slug);
  if (!loaded) notFound();
  const { page, tools, missing } = loaded;
  const [left, right] = page.sides.map((side) => tools.get(side.toolSlug));
  const names = [left?.name ?? page.sides[0].toolSlug, right?.name ?? page.sides[1].toolSlug];
  const related = listRelatedEditorial(page);
  const relatedTools = await listEditorialTools(related.flatMap((item) => item.kind === "compare" ? item.sides.map((side) => side.toolSlug) : item.picks.map((pick) => pick.toolSlug)));

  return (
    <main className={`${catalogStyles.main} ${catalogStyles.wide}`}>
      <JsonLd data={editorialStructuredData(page, tools, appBaseUrl())} />
      <EditorialHero page={page} missing={missing}>
        <div className={styles.verdict}>
          <strong>Short answer</strong>
          <p>{page.verdict}</p>
        </div>
      </EditorialHero>

      <article className={styles.article}>
        <section aria-labelledby="choose-title">
          <h2 id="choose-title" className={styles.srOnly}>Which one to choose</h2>
          <div className={styles.sides}>
            {page.sides.map((side) => {
              const tool = tools.get(side.toolSlug);
              if (!tool) return null;
              return (
                <div className={styles.side} key={side.toolSlug}>
                  <div className={styles.sideIdentity}>
                    <ToolMark name={tool.name} logoAssetKey={tool.logoAssetKey} variant="option" />
                    <h3>Choose {tool.name} if</h3>
                  </div>
                  <ul>{side.chooseIf.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                  <div className={styles.pickActions}>
                    <span className={styles.checked}><span aria-hidden="true" />{checkedLabel(tool)}</span>
                    <Link href={`/tools/${tool.slug}`}>Profile</Link>
                    <a href={catalogWebsiteOutboundUrl(tool.websiteUrl)} target="_blank" rel={catalogWebsiteRel(tool.sourceProvider)}>Visit ↗</a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="overview-title">
          <h2 id="overview-title">Overview</h2>
          <Prose paragraphs={page.intro} />
        </section>

        <section className={styles.section} aria-labelledby="facts-title">
          <h2 id="facts-title">Facts at a glance</h2>
          <FactsTable
            caption="From each tool's official website"
            tools={[left, right].filter((tool): tool is EditorialTool => Boolean(tool))}
          />
        </section>

        <section className={styles.section} aria-labelledby="differences-title">
          <h2 id="differences-title">Where they differ</h2>
          <div className={styles.tableWrap}>
            <table className={`${styles.factsTable} ${styles.differences}`}>
              <caption>Editorial comparison</caption>
              <thead>
                <tr>
                  <th scope="col"><span className={styles.srOnly}>Topic</span></th>
                  <th scope="col">{names[0]}</th>
                  <th scope="col">{names[1]}</th>
                </tr>
              </thead>
              <tbody>
                {page.differences.map((row) => (
                  <tr key={row.topic}>
                    <th scope="row">{row.topic}</th>
                    <td>{row.left}</td>
                    <td>{row.right}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <FaqSection faq={page.faq} />
        <RelatedEditorial pages={related} tools={relatedTools} />
        <EditorialDisclosure />
      </article>
    </main>
  );
}
