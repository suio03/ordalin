import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/agents/json-ld";
import { LlmsTxtChecker } from "@/components/free-tools/llms-txt-checker";
import styles from "@/components/directory/catalog-page.module.css";
import guide from "@/components/free-tools/ai-visibility-checker.module.css";
import { withSocial } from "@/lib/seo";

const PATH = "/free-tools/llms-txt-checker";
const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "https://ordalin.com";

export const metadata: Metadata = withSocial({
  alternates: { canonical: PATH },
  title: { absolute: "Free llms.txt Checker & Validator: Test Your llms.txt File | Ordalin" },
  description:
    "Free llms.txt checker and validator. Enter your URL to check that llms.txt loads as plain text, follows the llmstxt.org format and links to pages that work.",
});

const example = `# Acme

> Acme turns meetings into searchable notes for product teams.

Acme works with Zoom, Google Meet and Microsoft Teams.

## Docs

- [Getting started](https://acme.com/docs/getting-started): Install Acme and record your first meeting
- [API reference](https://acme.com/docs/api): Endpoints for notes and transcripts

## Optional

- [Privacy policy](https://acme.com/privacy)`;

const faq = [
  {
    q: "Is this llms.txt checker free?",
    a: "Yes. There is no sign-up. Checking a website is limited to 10 checks an hour per visitor so the tool stays available; checking pasted text has no limit because it runs in your browser.",
  },
  {
    q: "Is an llms.txt checker the same as an llms.txt validator?",
    a: "Yes, people use both names for the same job: making sure the file follows the llmstxt.org format. This tool also checks the parts a format validator cannot see, such as how your server sends the file and whether the linked pages load.",
  },
  {
    q: "Does it check llms-full.txt?",
    a: "No. llms-full.txt is not part of the llmstxt.org proposal and has no agreed format, so there is nothing fixed to validate it against.",
  },
  {
    q: "Does a valid llms.txt improve AI visibility?",
    a: "No one has shown that it does. As of October 2026, none of the major AI companies has said its crawlers use llms.txt to choose which pages to cite. A valid file mainly helps AI coding tools and agents that look for it.",
  },
  {
    q: "Do you store my file?",
    a: "No. Website checks are not cached and the file is not saved. We keep a hashed, unreadable record of your IP address for up to a day for rate limiting. Pasted text never leaves your browser.",
  },
];

export default function LlmsTxtCheckerPage() {
  return (
    <main className={styles.main}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Free tool</p>
          <h1>llms.txt Checker</h1>
          <p className={styles.description}>
            Check that your llms.txt file loads, follows the llmstxt.org format and links to pages that work. Enter your website, or paste the file to validate it in your browser.
          </p>
        </div>
      </header>

      <LlmsTxtChecker turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />

      <div className={`${styles.prose} ${guide.guide}`}>
        <section>
          <h2>How to check if a website supports llms.txt</h2>
          <p>Open <code>https://the-domain.com/llms.txt</code> in a browser. The site supports llms.txt if that address shows a plain text file that starts with a <code>#</code> heading. If you see the site&apos;s normal page, a not-found page or a download prompt, it does not, or the file is not served correctly.</p>
          <p>A browser hides some problems, such as a wrong content type, a redirect to another domain or links to pages that no longer exist. Enter the site in the checker above to test those too.</p>
        </section>

        <section>
          <h2>What a valid llms.txt file looks like</h2>
          <p>The format comes from the <a href="https://llmstxt.org/">llmstxt.org</a> proposal. In order, a valid file has:</p>
          <ul>
            <li>An H1 with the site or product name. This is the only required part.</li>
            <li>A blockquote with a short summary, directly under the H1.</li>
            <li>Optional paragraphs or lists with more context, without headings.</li>
            <li>H2 sections, each with a list of links written as <code>- [Page name](url): notes</code>. The notes are optional.</li>
            <li>An optional section named <code>Optional</code> for links an AI tool can skip when it needs a shorter context.</li>
          </ul>
          <pre><code>{example}</code></pre>
        </section>

        <section>
          <h2>What this llms.txt checker tests</h2>
          <ul>
            <li><strong>Delivery.</strong> That <code>/llms.txt</code> returns HTTP 200 as <code>text/plain</code> or <code>text/markdown</code>, not an HTML page, and does not redirect to another site.</li>
            <li><strong>H1 and summary.</strong> That the file starts with one H1 and has a blockquote summary under it.</li>
            <li><strong>Sections.</strong> That links sit in H2 sections. Sections with only text and H3 subheadings are noted, since tools that read the file use the links.</li>
            <li><strong>Link format.</strong> That every list item is a <code>[name](url)</code> link with a full URL, and no page is listed twice.</li>
            <li><strong>Links that load.</strong> When you check a website, we request the first 20 links and report broken pages, redirects and links that use <code>http://</code>.</li>
          </ul>
          <p>Every check is a fixed rule; no AI reviews your file.</p>
        </section>

        <section>
          <h2>Common llms.txt errors and how to fix them</h2>
          <h3>/llms.txt shows your website instead of the file</h3>
          <p>Single-page apps and many hosts send the homepage or a not-found page for any unknown path, with HTTP 200. Put the file in the folder your host serves from the site root, such as <code>public</code> in Next.js, Astro or Vite, and deploy again.</p>
          <h3>The file does not start with an H1</h3>
          <p>The first line must be <code># Your product</code>, with one space after the <code>#</code>. Front matter, a title in bold or a blank heading do not count.</p>
          <h3>Links are not under H2 sections</h3>
          <p>Tools that read llms.txt look for links inside <code>##</code> sections. Group your links under headings such as <code>## Docs</code> and <code>## Product</code>. H3 subheadings inside a section are fine; they are read as part of the H2 above them.</p>
          <h3>Relative or broken links</h3>
          <p>Write full URLs such as <code>https://acme.com/pricing</code>, not <code>/pricing</code>, and update links when you move or delete pages. The <Link href="/free-tools/llms-txt-generator">llms.txt generator</Link> can rebuild the list from your sitemap.</p>
          <h3>Wrong content type</h3>
          <p>If the file is served as <code>application/octet-stream</code>, browsers download it and some tools skip it. Set <code>Content-Type: text/plain; charset=utf-8</code> for the path in your host or CDN settings.</p>
        </section>

        <section>
          <h2>FAQ</h2>
          {faq.map((item) => (
            <div key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
          <p>If you build an AI tool, an <Link href="/submit">Ordalin listing</Link> is free and gives AI answers another researched page about your product to cite.</p>
        </section>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebApplication",
              name: "llms.txt Checker",
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
