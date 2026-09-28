import type { ToolCard } from "@/lib/repositories/catalog";
import { ToolRow } from "./tool-row";
import styles from "./directory.module.css";

export function ToolList({
  tools,
  emptyMessage = "No tools found. Try another category or filter.",
}: {
  tools: ToolCard[];
  emptyMessage?: string;
}) {
  if (tools.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h2>No tools found</h2>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={styles.toolList}>
      {tools.map((tool) => (
        <ToolRow key={tool.id} tool={tool} />
      ))}
    </div>
  );
}
