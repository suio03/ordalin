import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatCheckedDate,
  formatPricingModel,
} from "@/lib/catalog";
import { catalogWebsiteOutboundUrl, catalogWebsiteRel } from "@/lib/catalog-links";
import { ToolMark } from "@/components/directory/tool-mark";
import {
  getTaskBySlug,
  listTaskOptions,
} from "@/lib/repositories/catalog";
import catalogStyles from "@/components/directory/catalog-page.module.css";
import styles from "@/components/tasks/task-page.module.css";

export const dynamic = "force-dynamic";

type TaskParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: TaskParams): Promise<Metadata> {
  const task = await getTaskBySlug((await params).slug);
  if (!task) return {};
  return {
    title: task.name,
    description: task.outcome,
    alternates: { canonical: `/tasks/${task.slug}` },
  };
}

export default async function TaskPage({ params }: TaskParams) {
  const slug = (await params).slug;
  const [task, options] = await Promise.all([
    getTaskBySlug(slug),
    listTaskOptions(slug),
  ]);
  if (!task || options.length < 3) notFound();

  return (
    <main className={`${catalogStyles.main} ${catalogStyles.wide}`}>
      <nav className={catalogStyles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/tasks">Find by goal</Link>
      </nav>

      <header className={styles.taskHero}>
        <p className={catalogStyles.eyebrow}>You want to</p>
        <h1>{task.name}</h1>
        <p className={styles.taskOutcome}>
          Three reviewed tools can help. Start with the situation that sounds
          most like yours.
        </p>
      </header>

      <section className={styles.quickStart} aria-labelledby="quick-start-title">
        <header className={styles.quickStartHeader}>
          <p className={catalogStyles.eyebrow}>Start here</p>
          <h2 id="quick-start-title">Which situation sounds like yours?</h2>
        </header>
        <div className={styles.choiceGrid}>
          {options.map((option) => (
            <a className={styles.choice} href={`#option-${option.slug}`} key={option.id}>
              <span>Choose {option.name} if</span>
              <strong>{option.bestFor}</strong>
              <small>See why it fits ↓</small>
            </a>
          ))}
        </div>
        <aside className={styles.guidance} aria-labelledby="guidance-title">
          <h2 id="guidance-title">The main decision</h2>
          <p>{task.guidance}</p>
        </aside>
      </section>

      <section aria-labelledby="options-title">
        <header className={styles.sectionHeader}>
          <h2 id="options-title">Check the details before you choose</h2>
          <p className={styles.sectionNote}>Price · difference · limitation</p>
        </header>

        <div className={styles.optionList}>
          {options.map((option) => (
            <article
              className={styles.option}
              id={`option-${option.slug}`}
              key={option.id}
              tabIndex={-1}
            >
              <div className={styles.optionIdentity}>
                <ToolMark name={option.name} logoAssetKey={option.logoAssetKey} variant="option" />
                <h3>{option.name}</h3>
                <div className={styles.optionMeta}>
                  <span>{formatPricingModel(option.pricingModel)}</span>
                  <span>{formatCheckedDate(option.lastCheckedAt)}</span>
                </div>
                <div className={styles.optionLinks}>
                  <Link className={styles.profileLink} href={`/tools/${option.slug}`}>
                    Tool profile
                  </Link>
                  <a
                    className={styles.visitLink}
                    href={catalogWebsiteOutboundUrl(option.websiteUrl)}
                    target="_blank"
                    rel={catalogWebsiteRel(option.sourceProvider)}
                  >
                    Visit website ↗
                  </a>
                </div>
              </div>

              <div className={styles.optionDecision}>
                <div className={styles.bestFit}>
                  <span className={styles.factLabel}>Choose {option.name} if</span>
                  <h4>{option.bestFor}</h4>
                </div>
                <dl className={styles.factGrid}>
                  <div>
                    <dt className={styles.factLabel}>Why this one</dt>
                    <dd>{option.keyDifference}</dd>
                  </div>
                  <div>
                    <dt className={styles.factLabel}>Know before choosing</dt>
                    <dd>{option.limitation}</dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      </section>

      <p className={styles.disclosure}>
        We do not rank these tools. Pricing and check dates come from the reviewed
        catalogue; the tool profile links to the supporting product source.
      </p>
    </main>
  );
}
