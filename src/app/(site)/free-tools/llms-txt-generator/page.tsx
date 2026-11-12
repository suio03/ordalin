import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/agents/json-ld";
import { LlmsTxtGenerator } from "@/components/free-tools/llms-txt-generator";
import styles from "@/components/directory/catalog-page.module.css";
import guide from "@/components/free-tools/ai-visibility-checker.module.css";
import { withSocial } from "@/lib/seo";

const PATH = "/free-tools/llms-txt-generator";
const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "https://ordalin.com";

export const metadata: Metadata = withSocial({
  alternates: { canonical: PATH },
  title: { absolute: "Free llms.txt Generator: Create an llms.txt File for Your Website | Ordalin" },
  description:
    "Free llms.txt generator. Enter your URL to generate an llms.txt file from your sitemap and page descriptions, edit the page list, then download it.",
});

const example = `# Acme

> Acme turns meetings into searchable notes for product teams.

## Docs

- [Getting started](https://acme.com/docs/getting-started): Install Acme and record your first meeting
- [API reference](https://acme.com/docs/api): Endpoints for notes and transcripts

## Product

- [Pricing](https://acme.com/pricing): Free, Pro and Business plans

## Optional

- [Privacy policy](https://acme.com/privacy)`;

const faq = [
  {
    q: "Is this llms.txt generator free?",
    a: "Yes. There is no sign-up and no daily file limit, apart from a rate limit that keeps the tool available for everyone. You can edit and download the file as often as you like.",
  },
  {
    q: "What is the difference between llms.txt and robots.txt?",
    a: "robots.txt tells crawlers which URLs they may fetch, and crawlers that respect it follow those rules. llms.txt does not allow or block anything. It is a markdown index that points language models to the pages worth reading. To control AI crawler access, edit robots.txt.",
  },
  {
    q: "What is llms-full.txt?",
    a: "Some sites also publish llms-full.txt, a single file with the full text of their docs. It is not part of the llmstxt.org proposal, and this generator does not create it, because it needs a clean markdown copy of every page.",
  },
  {
    q: "How often should I update llms.txt?",
    a: "Whenever you add, rename or remove a page you listed, such as a new docs section or a pricing change. Run the generator again and compare the result with your current file.",
  },
  {
    q: "Do you store my website or the file?",
    a: "We keep the latest generated draft for each domain for up to six hours so repeat requests are fast, and a hashed, unreadable record of your IP address for up to a day for rate limiting. Your edits stay in your browser and the download is created there.",
  },
];

export default function LlmsTxtGeneratorPage() {
  return (
    <main className={styles.main}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Free tool</p>
          <h1>Free llms.txt Generator</h1>
          <p className={styles.description}>
            Enter your website to generate an llms.txt file from your sitemap and page descriptions. Choose which pages to keep, edit the text, then download the file.
          </p>
        </div>
      </header>

      <LlmsTxtGenerator turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />

      <div className={`${styles.prose} ${guide.guide}`}>
        <section>
          <h2>What is an llms.txt file</h2>
          <p>llms.txt is a markdown file at the root of a website, proposed at <a href="https://llmstxt.org/">llmstxt.org</a>, that gives language models a short map of the site. The format is fixed:</p>
          <ul>
            <li>An H1 with the site or product name. This is the only required part.</li>
            <li>A blockquote with a one-line summary.</li>
            <li>Optional paragraphs with more context.</li>
            <li>H2 sections, each with a list of links written as <code>- [Page name](url): notes</code>.</li>
            <li>A section named <code>Optional</code> for links an AI tool can skip when it needs a shorter context.</li>
          </ul>
          <pre><code>{example}</code></pre>
        </section>

        <section>
          <h2>How this llms.txt generator builds your file</h2>
          <p>The generator follows fixed rules. No AI writes or rewrites your text:</p>
          <ul>
            <li><strong>Name and summary.</strong> The H1 comes from your homepage&apos;s <code>og:site_name</code> or title, and the summary from its meta description.</li>
            <li><strong>Pages.</strong> We read the sitemap named in robots.txt, or <code>/sitemap.xml</code>, including up to three child sitemaps of a sitemap index. Without a sitemap, we use the links on your homepage.</li>
            <li><strong>Filtering.</strong> We leave out other domains, URLs with query parameters, sign-in and checkout pages, tag and author archives, pagination, feeds, translated copies, pages robots.txt blocks, broken pages and pages marked <code>noindex</code>. Every page we leave out is listed with the reason.</li>
            <li><strong>Sections.</strong> Pages are grouped by URL path into Docs, Product, Use cases, Blog and Company, with legal pages under Optional. Up to 30 pages are listed: top-level pages first, a few pages from each folder, and the six newest blog posts.</li>
            <li><strong>Descriptions.</strong> Each link&apos;s note is that page&apos;s own meta description. Pages without one get a plain link for you to describe.</li>
          </ul>
          <p>Already have an llms.txt file? The <Link href="/free-tools/llms-txt-checker">llms.txt checker</Link> validates its format and tests its links.</p>
          <p>Treat the result as a first draft. The best llms.txt files are short and point to the pages that answer real questions about your product.</p>
        </section>

        <section id="upload">
          <h2>Where to upload llms.txt</h2>
          <p>The file must load at <code>https://your-domain.com/llms.txt</code> as plain text. A copy in a subfolder, such as <code>/docs/llms.txt</code>, covers only that folder.</p>
          <h3>Next.js, Astro, Vite and most static sites</h3>
          <p>Put <code>llms.txt</code> in the <code>public</code> folder and deploy. Files there are served from the site root.</p>
          <h3>WordPress</h3>
          <p>Upload the file to the folder that holds <code>wp-config.php</code> over SFTP or your host&apos;s file manager. Some SEO plugins can also generate and serve llms.txt.</p>
          <h3>Webflow, Framer and other hosted builders</h3>
          <p>Some hosted builders do not let you add files at the root. Check your builder&apos;s settings or help center for llms.txt or root file support. If there is none, serve the file from a CDN in front of the site, as below.</p>
          <h3>Cloudflare and other CDNs</h3>
          <p>If your site runs behind a CDN with edge functions, such as Cloudflare Workers, you can return the file for the <code>/llms.txt</code> path from there.</p>
        </section>

        <section>
          <h2>Does llms.txt help AI visibility?</h2>
          <p>No one has shown that it does. llms.txt is a community proposal. As of October 2026, none of the major AI companies has said its crawlers use llms.txt to choose which pages to cite. It is cheap to publish and can help AI coding tools and agents that look for it, so it is worth a few minutes, but it is not a ranking lever.</p>
          <p>llms.txt also does not control access. Crawlers that respect robots.txt follow robots.txt, so that is where you allow or block GPTBot, ClaudeBot and other AI crawlers. To see what those crawlers can actually reach and read on your site, run the <Link href="/free-tools/ai-visibility-checker">AI visibility checker</Link>.</p>
          <p>If you build an AI tool, an <Link href="/submit">Ordalin listing</Link> is free and gives AI answers another researched page about your product to cite.</p>
        </section>

        <section>
          <h2>FAQ</h2>
          {faq.map((item) => (
            <div key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
        </section>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebApplication",
              name: "llms.txt Generator",
              url: `${SITE}${PATH}`,
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Any",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              publisher: { "@type": "Organization", name: "Ordalin", url: `${SITE}/` },
            },
            {
              "@type": "FAQPage",
              mainEntity: faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
            },
          ],
        }}
      />
    </main>
  );
}
