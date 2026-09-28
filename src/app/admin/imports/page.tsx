import type { Metadata } from "next";
import { headers } from "next/headers";
import { ImportReviewQueue } from "@/components/admin/import-review-queue";
import styles from "@/components/admin/imports.module.css";
import { requireAdminAccess } from "@/lib/admin/access";
import { listAdminImports } from "@/lib/admin/imports";
import { loadCatalogTaxonomy } from "@/lib/catalog-analysis/taxonomy";
import { getCloudflareEnv } from "@/lib/cloudflare";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Import review",
  robots: { index: false, follow: false },
};

export default async function AdminImportsPage() {
  const env = await getCloudflareEnv();
  const runtimeEnv = env as CloudflareEnv & {
    CLOUDFLARE_ACCESS_TEAM_DOMAIN?: string;
    CLOUDFLARE_ACCESS_AUD?: string;
  };
  await requireAdminAccess(await headers(), runtimeEnv);
  const [imports, taxonomy] = await Promise.all([
    listAdminImports(env.DB),
    loadCatalogTaxonomy(env.DB),
  ]);
  const counts = imports.reduce((result, item) => {
    result[item.status] = (result[item.status] ?? 0) + 1;
    return result;
  }, {} as Record<string, number>);
  const items = imports.map((item) => {
    const analysis = item.analysis;
    return {
      id: item.id,
      provider: item.provider,
      discoveryUrl: item.discovery_url,
      websiteUrl: item.website_url,
      canonicalDomain: item.canonical_domain,
      status: item.status,
      discoveredAt: item.discovered_at,
      toolSlug: item.tool_slug,
      name: item.tool_name ?? analysis?.name ?? "",
      tagline: item.tagline ?? analysis?.tagline ?? "",
      description: item.description ?? analysis?.description ?? "",
      pricingModel: item.pricing_model ?? analysis?.pricingModel ?? "unknown",
      primaryCategorySlug: item.primary_category_slug ?? analysis?.primaryCategorySlug ?? taxonomy.categories[0]?.slug ?? "other",
      categorySlugs: item.categorySlugs.length ? item.categorySlugs : analysis?.categorySlugs ?? [],
      tagSlugs: item.tagSlugs.length ? item.tagSlugs : analysis?.tagSlugs ?? [],
      decisionReasons: item.decisionReasons,
      evidenceUrls: analysis ? [...new Set(Object.values(analysis.evidence).flat())] : [],
      hasScreenshot: Boolean(item.screenshot_asset_key),
      errorSummary: item.error_summary,
    };
  });

  return (
    <main className={styles.main}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Private catalogue operations</p>
          <h1>Import review</h1>
          <p>Only exceptions should need attention. Every automated decision keeps its source, evidence, and reason.</p>
        </div>
        <div className={styles.metrics} aria-label="Import totals">
          <div><strong>{counts.pending_review ?? 0}</strong><span>Needs review</span></div>
          <div><strong>{counts.published ?? 0}</strong><span>Published</span></div>
          <div><strong>{counts.skipped ?? 0}</strong><span>Skipped</span></div>
        </div>
      </header>
      {items.length ? (
        <ImportReviewQueue
          items={items}
          categories={taxonomy.categories.filter((category) => category.slug !== "other").map(({ slug, name }) => ({ slug, name }))}
          tags={taxonomy.tags.map(({ slug, name, kind, groupSlug }) => ({ slug, name, kind, groupSlug }))}
        />
      ) : <p className={styles.empty}>No imports have been discovered yet.</p>}
    </main>
  );
}
