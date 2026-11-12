import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/app/(site)/guides/guides.module.css";
import hub from "@/app/(site)/free-tools/free-tools.module.css";
import { extraLocales, localeInfo, localizePath, type ExtraLocale } from "@/lib/free-tools/i18n";
import { localizedHubs, type ShapeSlug } from "@/lib/free-tools/image-shape/pages";
import { freeToolPath, freeToolsHubPath } from "@/lib/free-tools/registry";
import { withSocial } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };
const hubFor = (locale: string) => localizedHubs[locale as ExtraLocale];

// Only locales with two or more localized tools have a hub (docs/i18n/README.md).
export const dynamicParams = false;
export const generateStaticParams = () => extraLocales.filter((locale) => localizedHubs[locale]).map((locale) => ({ locale }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const copy = hubFor(locale);
  if (!copy) return {};
  return withSocial({
    title: { absolute: copy.title },
    description: copy.description,
    alternates: {
      canonical: localizePath(freeToolsHubPath, locale as ExtraLocale),
      languages: { en: freeToolsHubPath, [locale]: localizePath(freeToolsHubPath, locale as ExtraLocale), "x-default": freeToolsHubPath },
    },
    openGraph: { locale: localeInfo[locale as ExtraLocale].og },
  });
}

export default async function LocalizedFreeToolsPage({ params }: Props) {
  const { locale } = await params;
  const copy = hubFor(locale);
  if (!copy) notFound();
  const tools = Object.entries(copy.tools) as [ShapeSlug, { name: string; summary: string }][];
  return (
    <main className={styles.main}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">{copy.home}</Link><span aria-hidden="true">/</span><span>{copy.h1}</span>
      </nav>

      <header className={styles.indexHeader}>
        <div>
          <h1>{copy.h1}</h1>
          <p>{copy.intro}</p>
        </div>
      </header>
      <section className={hub.group}>
        <div className={styles.guideGrid}>
          {tools.map(([slug, tool], index) => (
            <Link
              className={`${styles.guideCard} ${hub.card}`}
              href={localizePath(freeToolPath(slug), locale as ExtraLocale)}
              prefetch={false}
              key={slug}
            >
              <span className={styles.cardNumber}>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{tool.name}</h3>
                <p>{tool.summary}</p>
              </div>
              <span className={styles.cardAction}>→</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
