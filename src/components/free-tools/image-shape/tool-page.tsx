import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/agents/json-ld";
import styles from "@/components/directory/catalog-page.module.css";
import guide from "@/components/free-tools/ai-visibility-checker.module.css";
import {
  plain,
  type Block,
  type ToolPageCopy,
} from "@/lib/free-tools/image-shape/page-copy";
import { localeInfo, localizePath, type Locale } from "@/lib/free-tools/i18n";
import shape from "./image-shape.module.css";

const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "https://ordalin.com";

/** Renders **bold** and [anchor](/path) inside copy strings. */
function Rich({ text }: { text: string }) {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      m[1] ? (
        <strong key={m.index}>{m[1]}</strong>
      ) : (
        <Link key={m.index} href={m[3]}>
          {m[2]}
        </Link>
      ),
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

function BlockView({ block }: { block: Block }) {
  if ("p" in block)
    return (
      <p>
        <Rich text={block.p} />
      </p>
    );
  if ("ol" in block)
    return (
      <ol>
        {block.ol.map((t) => (
          <li key={t}>
            <Rich text={t} />
          </li>
        ))}
      </ol>
    );
  if ("ul" in block)
    return (
      <ul>
        {block.ul.map((t) => (
          <li key={t}>
            <Rich text={t} />
          </li>
        ))}
      </ul>
    );
  return (
    <div className={shape.tableScroll}>
      <table>
        {block.table.head.some(Boolean) ? (
          <thead>
            <tr>
              {block.table.head.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {block.table.rows.map((row) => (
            <tr key={row[0]}>
              {row.map((c, i) => (
                <td key={i}>
                  <Rich text={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ToolPage({
  copy,
  path,
  name,
  tool,
  locale = "en",
  locales = ["en"],
}: {
  copy: ToolPageCopy;
  path: string;
  name: string;
  tool: ReactNode;
  locale?: Locale;
  /** Every locale this page is published in, for the language switcher. */
  locales?: Locale[];
}) {
  const url = `${SITE}${localizePath(path, locale)}`;
  return (
    <main className={styles.main}>
      <header className={styles.pageHeader}>
        <div>
          <h1>{copy.h1}</h1>
          <p className={styles.description}>{copy.subtitle}</p>
          {locales.length > 1 ? (
            <ul className={shape.languages} aria-label="Language">
              {locales.map((l) => (
                <li key={l}>
                  <Link
                    href={localizePath(path, l)}
                    hrefLang={l}
                    lang={l}
                    prefetch={false}
                    aria-current={l === locale ? "page" : undefined}
                  >
                    {localeInfo[l].name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </header>

      {tool}

      <div className={`${styles.prose} ${guide.guide} ${shape.copy}`}>
        {copy.sections.map((s) => (
          <section key={s.id} id={s.id}>
            <h2>{s.h2}</h2>
            {s.blocks.map((b, i) => (
              <BlockView key={i} block={b} />
            ))}
          </section>
        ))}
        <section id="faq">
          <h2>{copy.faqHeading}</h2>
          {copy.faq.map((item) => (
            <div key={item.q}>
              <h3>{item.q}</h3>
              <p>
                <Rich text={item.a} />
              </p>
            </div>
          ))}
          <p>
            <Rich text={copy.closing} />
          </p>
        </section>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebApplication",
              name,
              url,
              description: copy.description,
              inLanguage: locale,
              applicationCategory: "MultimediaApplication",
              operatingSystem: "Any",
              browserRequirements: "Requires JavaScript",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              publisher: {
                "@type": "Organization",
                name: "Ordalin",
                url: `${SITE}/`,
              },
            },
            {
              "@type": "FAQPage",
              inLanguage: locale,
              mainEntity: copy.faq.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: { "@type": "Answer", text: plain(item.a) },
              })),
            },
          ],
        }}
      />
    </main>
  );
}
