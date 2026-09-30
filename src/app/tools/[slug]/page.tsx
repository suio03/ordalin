import { ResearchCitations, ResearchedProfileContent } from "@/components/directory/researched-profile-content";
import { detailFields, detailLabels } from "@/lib/submissions/profile";
import type { Metadata } from "next";
import { getToolProfile } from "@/content/tool-profiles/granola";
import { ProfileCitation, ToolProfileContent, ToolProfileNav } from "@/components/directory/tool-profile-content";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCheckedDate, formatPricingModel } from "@/lib/catalog";
import { catalogAssetUrl } from "@/lib/catalog-assets";
import { catalogWebsiteOutboundUrl, catalogWebsiteRel } from "@/lib/catalog-links";
import { ToolMark } from "@/components/directory/tool-mark";
import { EditorialCard } from "@/components/editorial/editorial-parts";
import { ToolRow } from "@/components/directory/tool-row";
import { listLiveEditorialForTool } from "@/lib/editorial/load";
import {
  getToolBySlug,
  listRelatedTools,
  listTasksForTool,
} from "@/lib/repositories/catalog";
import editorialStyles from "@/components/editorial/editorial.module.css";
import styles from "@/components/directory/catalog-page.module.css";

export const dynamic = "force-dynamic";

type ToolParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ToolParams): Promise<Metadata> {
  const tool = await getToolBySlug((await params).slug);
  if (!tool) return {};
  const profile = getToolProfile(tool.slug);
  return {
    title: profile ? { absolute: `${profile.title} | Ordalin` } : tool.name,
    description: profile?.description ?? tool.researchedProfile?.overview.text ?? tool.tagline,
    ...(profile ? {
      openGraph: {
        type: "website", title: `${profile.title} | Ordalin`,
        description: profile.description, url: `/tools/${tool.slug}`, siteName: "Ordalin",
        images: [{ url: profile.screenshot, width: 1440, height: 900, alt: "Granola product website" }],
      },
      twitter: { card: "summary_large_image", title: profile.title, description: profile.description, images: [profile.screenshot] },
    } : {}),
    alternates: { canonical: `/tools/${tool.slug}` },
  };
}

export default async function ToolPage({ params }: ToolParams) {
  const slug = (await params).slug;
  const [tool, relatedTasks, relatedTools, featuredIn] = await Promise.all([
    getToolBySlug(slug),
    listTasksForTool(slug),
    listRelatedTools(slug),
    listLiveEditorialForTool(slug),
  ]);
  if (!tool) notFound();

  const profile = getToolProfile(slug);
  const research = tool.researchedProfile;
  const browseCategories = tool.tagDetails.filter((tag) => tag.kind === "category");
  const interfaces = tool.tagDetails.filter((tag) => tag.kind === "interface");
  const attributes = tool.tagDetails.filter((tag) => tag.kind === "attribute");
  const screenshotUrl = profile?.screenshot ?? catalogAssetUrl(tool.screenshotAssetKey);
  const isSubmitted = tool.sourceProvider === "submission";
  const isAutomatedImport = tool.sourceProvider === "toolify" || tool.sourceProvider === "product_hunt";
  const profileLabel = isSubmitted
    ? "Submitted tool profile"
    : isAutomatedImport
      ? "Website-checked tool profile"
      : "Reviewed tool profile";
  const factsLabel = isSubmitted ? "Submitted information" : profile || isAutomatedImport ? "Website facts" : "Verified facts";
  const sourceLabel = isSubmitted
    ? "Submitted website ↗"
    : isAutomatedImport
      ? "Source listing ↗"
      : "Official product page ↗";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: profile?.overview ?? research?.overview.text ?? tool.description,
    url: tool.websiteUrl,
    applicationCategory: browseCategories.map((category) => category.name).join(", ") || tool.primaryCategory.name,
  };

  return (
    <main className={styles.main}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
        }}
      />
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span>
        <Link href={`/categories/${tool.primaryCategory.slug}`}>{tool.primaryCategory.name}</Link>
      </nav>
      <header className={styles.detailHero}>
        {profile ? <Image src={profile.logo} unoptimized alt="" width={72} height={72} className={styles.editorialLogo} /> : <ToolMark name={tool.name} logoAssetKey={tool.logoAssetKey} variant="hero" />}
        <div>
          <p className={styles.eyebrow}>{profile ? "Website-checked tool profile" : profileLabel}</p>
          <h1>{tool.name}</h1>
          <p className={styles.description}>{profile?.tagline ?? tool.tagline}</p>
          <p className={styles.checkedState}>{!isSubmitted ? <span aria-hidden="true" /> : null}{profile ? <>Sources checked <time dateTime={profile.checkedAt}>{profile.checkedLabel}</time></> : research ? <>Sources checked <time dateTime={research.checkedAt}>{formatCheckedDate(Math.floor(Date.parse(research.checkedAt) / 1000)).replace(/^Checked /, "")}</time></> : isSubmitted ? "Confirmed by submitter" : formatCheckedDate(tool.lastCheckedAt)}</p>
        </div>
        <a
          className={styles.primaryAction}
          href={catalogWebsiteOutboundUrl(tool.websiteUrl)}
          target="_blank"
          rel={catalogWebsiteRel(tool.sourceProvider)}
        >
          Visit website ↗
        </a>
      </header>

      <dl className={styles.profileLedger} aria-label="Tool overview">
        <div><dt>Pricing</dt><dd>{profile ? "Free · Paid from $14 / user / month" : research?.pricingSummary.text ?? formatPricingModel(tool.pricingModel)}{research ? <ResearchCitations evidence={research.pricingSummary.evidence} /> : null}</dd></div>
        <div><dt>Available as</dt><dd>{profile?.platforms ?? (research ? research.platforms.map(item => item.text).join(" · ") || "Not yet verified" : (interfaces.length ? interfaces.map((tag) => tag.name).join(" · ") : "Not yet verified"))}{research ? research.platforms.map(item => <ResearchCitations key={item.text} evidence={item.evidence} />) : null}</dd></div>
        <div><dt>Primary group</dt><dd>{tool.primaryCategory.name}</dd></div>
      </dl>

      {profile || research ? <ToolProfileNav mobile /> : null}

      <div className={styles.detailGrid}>
        <div className={styles.detailContent}>
          <section className={styles.detailSection}>
            <h2>What it does</h2>
            <p>{profile?.overview ?? research?.overview.text ?? tool.description}</p>
            {profile ? <><ProfileCitation profile={profile} source="notes" /> · <ProfileCitation profile={profile} source="capture" /></> : research ? <ResearchCitations evidence={research.overview.evidence} /> : null}
          </section>

          {profile ? <ToolProfileContent profile={profile} /> : research ? <ResearchedProfileContent profile={research} /> : tool.submittedProfile ? detailFields.map(key => {
            const field = tool.submittedProfile?.fields[key];
            return field?.text ? <section className={styles.detailSection} key={key}>
              <h2>{detailLabels[key]}</h2>
              <p className={styles.submittedDetail}>{field.text}</p>
              <small>{field.origin === "website" && field.sources[0] ? <a href={field.sources[0]} target="_blank" rel="noopener noreferrer">Website source ↗</a> : "Submitted information"}</small>
            </section> : null;
          }) : null}

          {screenshotUrl ? (
            <figure className={styles.websitePreview}>
              <div className={styles.previewFrame}>
                <Image
                  src={screenshotUrl}
                  alt={profile ? `${tool.name} product website preview` : `${tool.name} product screenshot`}
                  width={1440}
                  height={900}
                  loading={profile ? "lazy" : "eager"}
                  sizes="(max-width: 820px) calc(100vw - 32px), 686px"
                  unoptimized
                />
              </div>
              <figcaption><span>{tool.submittedProfile?.screenshot === "uploaded" ? "Submitted screenshot" : "Website preview"}</span><span>Fixed desktop viewport · 1440 × 900</span></figcaption>
            </figure>
          ) : null}

          {relatedTasks.length ? (
            <section className={styles.fitSection} aria-labelledby="related-tasks-title">
              <header className={styles.fitHeader}>
                <div>
                  <p className={styles.eyebrow}>Decision notes</p>
                  <h2 id="related-tasks-title">Where {tool.name} fits</h2>
                </div>
                <p>Context-specific guidance, not a universal ranking.</p>
              </header>
              <div className={styles.fitList}>
                {relatedTasks.map((task) => (
                  <article className={styles.fitItem} key={task.slug}>
                    <div className={styles.fitIdentity}>
                      <Link href={`/tasks/${task.slug}`}>{task.name}</Link>
                      <span>{task.publishedToolCount} verified options</span>
                    </div>
                    <dl>
                      <div><dt>Good fit if</dt><dd>{task.bestFor}</dd></div>
                      <div><dt>Why this one</dt><dd>{task.keyDifference}</dd></div>
                      <div><dt>Consider alternatives if</dt><dd>{task.limitation}</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {featuredIn.pages.length ? (
            <section className={styles.fitSection} aria-labelledby="featured-in-title">
              <header className={styles.fitHeader}>
                <div>
                  <p className={styles.eyebrow}>Editorial</p>
                  <h2 id="featured-in-title">Featured in</h2>
                </div>
                <p>Shortlists, alternatives and comparisons that include {tool.name}.</p>
              </header>
              <div className={editorialStyles.cardGrid}>
                {featuredIn.pages.slice(0, 6).map((page) => (
                  <EditorialCard key={`${page.kind}/${page.slug}`} page={page} tools={featuredIn.tools} />
                ))}
              </div>
            </section>
          ) : null}

          {relatedTools.length ? (
            <section className={styles.fitSection} aria-labelledby="related-tools-title">
              <header className={styles.fitHeader}>
                <div>
                  <p className={styles.eyebrow}>Similar tools</p>
                  <h2 id="related-tools-title">Tools like {tool.name}</h2>
                </div>
                <p>Published tools that share its categories.</p>
              </header>
              <div className={styles.relatedList}>
                {relatedTools.map((related) => <ToolRow key={related.slug} tool={related} />)}
              </div>
            </section>
          ) : null}
        </div>
        <aside className={styles.factPanel} aria-labelledby="facts-title">
          {profile || research ? <ToolProfileNav /> : null}
          <h2 id="facts-title">{factsLabel}</h2>
          <dl className={styles.factList}>
            <div>
              <dt>Category groups</dt>
              <dd className={styles.tagList}>
                {tool.categories.map((category) => (
                  <Link key={category.slug} href={`/categories/${category.slug}`}>{category.name}</Link>
                ))}
              </dd>
            </div>
            {browseCategories.length ? (
              <div>
                <dt>Categories</dt>
                <dd className={styles.tagList}>
                  {browseCategories.map((category) =>
                    category.groupSlug ? (
                      <Link key={category.slug} href={`/categories/${category.groupSlug}/${category.slug}`}>
                        {category.name}
                      </Link>
                    ) : null,
                  )}
                </dd>
              </div>
            ) : null}
            {interfaces.length ? <div><dt>Interfaces</dt><dd className={styles.tagList}>{interfaces.map((tag) => <span key={tag.slug}>{tag.name}</span>)}</dd></div> : null}
            {attributes.length ? <div><dt>Attributes</dt><dd className={styles.tagList}>{attributes.map((tag) => <span key={tag.slug}>{tag.name}</span>)}</dd></div> : null}
            <div><dt>Domain</dt><dd>{tool.canonicalDomain}</dd></div>
            {tool.sourceUrl ? <div><dt>Fact source</dt><dd><a href={tool.sourceUrl} target="_blank" rel="noopener noreferrer">{sourceLabel}</a></dd></div> : null}
          </dl>
        </aside>
      </div>
    </main>
  );
}
