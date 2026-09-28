import type { Metadata } from "next";
import Link from "next/link";
import { listTasks } from "@/lib/repositories/catalog";
import catalogStyles from "@/components/directory/catalog-page.module.css";
import styles from "@/components/tasks/task-page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Find AI tools by goal",
  description:
    "Choose what you want to accomplish, then compare three reviewed AI tools that can help you do it.",
  alternates: { canonical: "/tasks" },
};

export default async function TasksPage() {
  const tasks = await listTasks();

  return (
    <main className={`${catalogStyles.main} ${catalogStyles.wide}`}>
      <header className={catalogStyles.pageHeader}>
        <div>
          <p className={catalogStyles.eyebrow}>Find tools by goal</p>
          <h1>What do you want to accomplish?</h1>
          <p className={catalogStyles.description}>
            Pick a goal. We will show you three reviewed tools and explain which
            one fits your situation.
          </p>
        </div>
        <p className={catalogStyles.count}>{tasks.length} goals</p>
      </header>

      <section className={styles.taskLedger} aria-label="Goals">
        {tasks.map((task) => (
          <Link className={styles.taskRow} href={`/tasks/${task.slug}`} key={task.slug}>
            <div className={styles.taskCopy}>
              <h2>{task.name}</h2>
              <p>{task.outcome}</p>
            </div>
            <span className={styles.taskMeta}>
              <span>{task.publishedToolCount} reviewed tools</span>
              <strong>Compare 3 tools →</strong>
            </span>
          </Link>
        ))}
      </section>

      <p className={styles.indexNote}>
        There is no universal winner. The right choice depends on what you
        already have, what you need to produce, and which limitation matters to you.
      </p>
    </main>
  );
}
