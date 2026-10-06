import Link from "next/link";
import { formatCheckedDate, formatPricingModel } from "@/lib/catalog";
import { catalogWebsiteOutboundUrl, catalogWebsiteRel } from "@/lib/catalog-links";
import type { ToolCard } from "@/lib/repositories/catalog";
import { ToolMark } from "./tool-mark";
import styles from "./directory.module.css";

export function ToolRow({ tool }: { tool: ToolCard }) {
  return (
    <article className={styles.toolRow}>
      <ToolMark name={tool.name} logoAssetKey={tool.logoAssetKey} />
      <div className={styles.toolMain}>
        <Link className={styles.toolName} href={`/tools/${tool.slug}`}>
          {tool.name}
          {tool.lastCheckedAt ? (
            <span className={styles.freshDot} aria-label="Recently checked" />
          ) : null}
        </Link>
        <span className={styles.toolPurpose}>{tool.tagline}</span>
      </div>
      <div className={styles.toolMeta}>
        <Link href={`/categories/${tool.primaryCategory.slug}`}>
          {tool.primaryCategory.name}
        </Link>
        <span>{formatPricingModel(tool.pricingModel)}</span>
        <span>{formatCheckedDate(tool.lastCheckedAt)}</span>
      </div>
      <a
        className={styles.visit}
        href={catalogWebsiteOutboundUrl(tool.websiteUrl)}
        data-tool={tool.slug}
        data-placement="row"
        target="_blank"
        rel={catalogWebsiteRel(tool.sourceProvider)}
        aria-label={`Visit ${tool.name} website`}
      >
        Visit <span aria-hidden="true">↗</span>
      </a>
    </article>
  );
}
