import Link from "next/link";
import { ToolMark } from "@/components/directory/tool-mark";
import { formatCheckedDate, formatPricingModel } from "@/lib/catalog";
import { catalogWebsiteOutboundUrl, catalogWebsiteRel } from "@/lib/catalog-links";
import {
  editorialHref,
  editorialKindLabels,
  editorialPaths,
  formatEditorialDate,
  type DecisionRow,
  type EditorialFaq,
  type EditorialPage,
  type EditorialPick,
} from "@/lib/editorial";
import type { EditorialTool } from "@/lib/repositories/catalog";
import catalogStyles from "@/components/directory/catalog-page.module.css";
import styles from "./editorial.module.css";

const hubLabels = { best: "Best of", alternatives: "Alternatives", compare: "Compare" } as const;

export function checkedLabel(tool: EditorialTool) {
  if (tool.checkedAt) return `Checked ${formatEditorialDate(tool.checkedAt.slice(0, 10))}`;
  return formatCheckedDate(tool.lastCheckedAt);
}

export function pricingLabel(tool: EditorialTool) {
  return tool.pricingSummary ?? formatPricingModel(tool.pricingModel);
}

export function EditorialHero({
  page,
  missing,
  children,
}: {
  page: EditorialPage;
  missing: string[];
  children?: React.ReactNode;
}) {
  return (
    <>
      <nav className={catalogStyles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href={editorialPaths[page.kind]}>{hubLabels[page.kind]}</Link>
      </nav>
      {page.status === "draft" ? (
        <aside className={styles.draftNotice} role="note">
          <strong>Draft preview.</strong> This page is not published and is not
          served in production.
          {missing.length ? <> Unpublished tools: {missing.join(", ")}.</> : null}
        </aside>
      ) : null}
      <header className={styles.hero}>
        <p className={catalogStyles.eyebrow}>{editorialKindLabels[page.kind]}</p>
        <h1>{page.title}</h1>
        <p className={styles.dek}>{page.description}</p>
        <p className={styles.byline}>
          <span>By {page.author}</span>
          <span aria-hidden="true">·</span>
          <span>
            {page.updatedAt ? "Updated " : "Published "}
            <time dateTime={page.updatedAt ?? page.publishedAt}>
              {formatEditorialDate(page.updatedAt ?? page.publishedAt)}
            </time>
          </span>
          <span aria-hidden="true">·</span>
          <Link href="/about/how-we-review">How we review</Link>
        </p>
        {page.disclosure ? (
          <p className={styles.disclosure} role="note">
            <strong>Disclosure:</strong> {page.disclosure}
          </p>
        ) : null}
        {children}
      </header>
    </>
  );
}

export function Prose({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className={styles.prose}>
      {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    </div>
  );
}

export function QuickPicks({ picks, tools }: { picks: EditorialPick[]; tools: Map<string, EditorialTool> }) {
  const available = picks.filter((pick) => tools.has(pick.toolSlug));
  return (
    <section className={styles.quickPicks} aria-labelledby="quick-picks-title">
      <h2 id="quick-picks-title">Quick picks</h2>
      <ol>
        {available.map((pick) => {
          const tool = tools.get(pick.toolSlug)!;
          return (
            <li key={pick.toolSlug}>
              <a href={`#pick-${tool.slug}`}>
                <ToolMark name={tool.name} logoAssetKey={tool.logoAssetKey} />
                <span>
                  <strong>{tool.name}</strong>
                  <small>{pick.label}</small>
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function PickEntry({ pick, tool, rank }: { pick: EditorialPick; tool: EditorialTool; rank: number }) {
  return (
    <article className={styles.pick} id={`pick-${tool.slug}`} tabIndex={-1}>
      <header className={styles.pickHeader}>
        <span className={styles.rank}>{String(rank).padStart(2, "0")}</span>
        <ToolMark name={tool.name} logoAssetKey={tool.logoAssetKey} variant="option" />
        <div>
          <p className={styles.pickLabel}>{pick.label}</p>
          <h3>{tool.name}</h3>
          <p className={styles.pickTagline}>{tool.tagline}</p>
        </div>
      </header>
      <dl className={styles.pickFacts}>
        <div><dt>Pricing</dt><dd>{pricingLabel(tool)}</dd></div>
        <div><dt>Available on</dt><dd>{tool.platforms.length ? tool.platforms.join(" · ") : "Not yet verified"}</dd></div>
        <div><dt>Category</dt><dd>{tool.primaryCategory.name}</dd></div>
      </dl>
      <Prose paragraphs={pick.summary} />
      <dl className={styles.fitGrid}>
        <div className={styles.fitGood}><dt>Choose it if</dt><dd>{pick.bestFor}</dd></div>
        <div><dt>Look elsewhere if</dt><dd>{pick.notIdealIf}</dd></div>
      </dl>
      <footer className={styles.pickActions}>
        <span className={styles.checked}><span aria-hidden="true" />{checkedLabel(tool)}</span>
        <Link href={`/tools/${tool.slug}`}>Full profile</Link>
        <a href={catalogWebsiteOutboundUrl(tool.websiteUrl)} data-tool={tool.slug} data-placement="editorial" target="_blank" rel={catalogWebsiteRel(tool.sourceProvider)}>
          Visit website ↗
        </a>
      </footer>
    </article>
  );
}

export function FactsTable({ tools, caption }: { tools: EditorialTool[]; caption: string }) {
  if (tools.length < 2) return null;
  const rows: Array<[string, (tool: EditorialTool) => React.ReactNode]> = [
    ["Pricing", pricingLabel],
    ["Free use", (tool) => tool.freeLimits[0] ?? "Not established from official pages"],
    ["Available on", (tool) => tool.platforms.join(" · ") || "Not yet verified"],
    ["Category", (tool) => tool.primaryCategory.name],
    ["Sources checked", checkedLabel],
  ];
  return (
    <div className={styles.tableWrap}>
      <table className={styles.factsTable}>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col"><span className={styles.srOnly}>Fact</span></th>
            {tools.map((tool) => (
              <th scope="col" key={tool.slug}>
                <Link href={`/tools/${tool.slug}`}>{tool.name}</Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              {tools.map((tool) => <td key={tool.slug}>{value(tool)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DecisionGuide({ rows, tools }: { rows: DecisionRow[]; tools: Map<string, EditorialTool> }) {
  const available = rows.filter((row) => tools.has(row.toolSlug));
  if (!available.length) return null;
  return (
    <section className={styles.section} aria-labelledby="decision-title">
      <h2 id="decision-title">Quick decision guide</h2>
      <ul className={styles.decisionList}>
        {available.map((row) => {
          const tool = tools.get(row.toolSlug)!;
          return (
            <li key={row.situation}>
              <span>{row.situation}</span>
              <a href={`#pick-${tool.slug}`}>{tool.name} →</a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function FaqSection({ faq }: { faq: EditorialFaq[] }) {
  return (
    <section className={styles.section} aria-labelledby="faq-title">
      <h2 id="faq-title">Questions people ask</h2>
      <div className={styles.faq}>
        {faq.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function EditorialCard({ page, tools }: { page: EditorialPage; tools?: Map<string, EditorialTool> }) {
  const slugs = page.kind === "compare"
    ? page.sides.map((side) => side.toolSlug)
    : page.picks.map((pick) => pick.toolSlug);
  const marks = tools ? slugs.map((slug) => tools.get(slug)).filter((tool): tool is EditorialTool => Boolean(tool)).slice(0, 5) : [];
  return (
    <Link className={styles.card} href={editorialHref(page)}>
      <span className={styles.cardKind}>{editorialKindLabels[page.kind]}</span>
      <strong>{page.title}</strong>
      <span className={styles.cardDescription}>{page.description}</span>
      {marks.length ? (
        <span className={styles.cardMarks}>
          {marks.map((tool) => <ToolMark key={tool.slug} name={tool.name} logoAssetKey={tool.logoAssetKey} />)}
          {page.kind !== "compare" ? <small>{page.picks.length} tools</small> : null}
        </span>
      ) : null}
    </Link>
  );
}

export function RelatedEditorial({ pages, tools, title = "Related guides" }: {
  pages: EditorialPage[];
  tools?: Map<string, EditorialTool>;
  title?: string;
}) {
  if (!pages.length) return null;
  return (
    <section className={styles.section} aria-labelledby="related-editorial-title">
      <h2 id="related-editorial-title">{title}</h2>
      <div className={styles.cardGrid}>
        {pages.map((page) => <EditorialCard key={`${page.kind}/${page.slug}`} page={page} tools={tools} />)}
      </div>
    </section>
  );
}

export function EditorialDisclosure() {
  return (
    <p className={styles.disclosure}>
      Ordalin does not accept payment for placement. Pricing, platforms and check
      dates come from each tool&apos;s official website as recorded in its profile;
      the editorial notes are our judgement. <Link href="/about/how-we-review">How we review</Link>.
    </p>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replaceAll("<", "\\u003c") }}
    />
  );
}
