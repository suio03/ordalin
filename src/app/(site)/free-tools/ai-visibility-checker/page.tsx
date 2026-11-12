import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/agents/json-ld";
import { AiVisibilityChecker } from "@/components/free-tools/ai-visibility-checker";
import styles from "@/components/directory/catalog-page.module.css";
import guide from "@/components/free-tools/ai-visibility-checker.module.css";
import { withSocial } from "@/lib/seo";

const PATH = "/free-tools/ai-visibility-checker";
const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "https://ordalin.com";

export const metadata: Metadata = withSocial({
  alternates: { canonical: PATH },
  title: { absolute: "Free AI Visibility Checker: Can ChatGPT and Claude Read Your Site? | Ordalin" },
  description:
    "Free AI visibility checker. Test whether ChatGPT, Claude, Perplexity and Google AI crawlers can reach, read and cite your website, with the fix for each issue.",
});

const robotsExample = `# AI search and answer crawlers: allowed
User-agent: OAI-SearchBot
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: PerplexityBot
Allow: /

# Training crawlers: your choice
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: CCBot
Disallow: /

Sitemap: https://your-product.com/sitemap.xml`;

const faq = [
  {
    q: "Is this AI visibility checker free?",
    a: "Yes. There is no sign-up, no email gate and no limit on how many sites you check, apart from a rate limit that keeps the tool available for everyone.",
  },
  {
    q: "How do I track AI visibility over time?",
    a: "Run this check after every change to robots.txt, your CDN or your site framework, since those are what usually break crawler access. To see whether AI answers actually mention your brand, ask ChatGPT, Claude and Perplexity the questions your customers ask, on a fixed schedule, and note which sources they cite. Paid brand-mention trackers automate that second part.",
  },
  {
    q: "Does llms.txt improve AI visibility?",
    a: "Not as far as anyone can show. llms.txt is a community proposal, and no major AI company has said its crawlers use it to pick sources. It is cheap to publish, so this checker reports it as a note and does not count it towards the result.",
  },
  {
    q: "Why does my CDN block AI crawlers when robots.txt allows them?",
    a: "Some CDNs and firewalls offer a one-click setting to block AI bots, and some hosts turn it on by default. Those rules run before robots.txt is ever read. If the crawler response check fails, look for AI bot or bot fight settings in your CDN or firewall dashboard.",
  },
  {
    q: "Do you store the URL I check?",
    a: "We keep the latest result for each domain for up to six hours so repeat checks are fast, and a hashed, unreadable record of your IP address for up to a day for rate limiting. We do not store page content or ask for your email.",
  },
];

export default function AiVisibilityCheckerPage() {
  return (
    <main className={styles.main}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Free tool</p>
          <h1>Free AI Visibility Checker</h1>
          <p className={styles.description}>
            Check whether ChatGPT, Claude, Perplexity and Google&apos;s AI features can reach, read and cite your website. Every result shows what we found and how to fix it.
          </p>
        </div>
      </header>

      <AiVisibilityChecker turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />

      <div className={`${styles.prose} ${guide.guide}`}>
        <section>
          <h2>What this AI visibility checker tests</h2>
          <p>AI answers can only cite pages their crawlers are allowed to fetch and able to read. This AI search visibility checker looks at the same files those crawlers do:</p>
          <ul>
            <li><strong>robots.txt rules</strong> for 17 AI and search crawlers, matched the way the robots.txt standard (RFC 9309) defines.</li>
            <li><strong>Crawler responses.</strong> We request your homepage as a normal browser and as OAI-SearchBot, Claude-SearchBot and PerplexityBot, to catch firewall and CDN blocks.</li>
            <li><strong>Indexing directives</strong> such as <code>noindex</code> and <code>nosnippet</code> in meta tags and the X-Robots-Tag header.</li>
            <li><strong>Content without JavaScript.</strong> Many AI crawlers do not run JavaScript, so a page that renders only in the browser looks empty to them.</li>
            <li><strong>Page basics and structured data:</strong> title, meta description, H1, canonical link and JSON-LD that names your product.</li>
            <li><strong>Sitemap and llms.txt.</strong> The sitemap helps crawlers find pages; llms.txt is reported as optional.</li>
          </ul>
          <p>The result is a count of checks passed, not a made-up score. Each check links its evidence, so you can confirm it yourself.</p>
        </section>

        <section>
          <h2>AI search crawlers vs training crawlers</h2>
          <p>AI companies run separate crawlers for separate jobs, and robots.txt treats each one on its own. OpenAI&apos;s OAI-SearchBot finds pages for ChatGPT search, while GPTBot collects training data. Anthropic splits Claude-SearchBot and Claude-User from ClaudeBot the same way.</p>
          <p>Blocking a training crawler is a reasonable policy and does not remove you from AI search results, so this AI search engine visibility checker reports training crawlers as information only. Blocking a search crawler does remove you from that engine&apos;s answers, so it counts as a failure. Google-Extended is a special case: it controls Gemini training and grounding in Gemini Apps, but not Google Search or AI Overviews.</p>
        </section>

        <section>
          <h2>How to fix each issue</h2>
          <p><strong>A search crawler is blocked.</strong> Give the AI search crawlers their own group that allows the site. You can still block training crawlers:</p>
          <pre><code>{robotsExample}</code></pre>
          <p><strong>Crawlers are refused but browsers are not.</strong> Turn off AI bot blocking in your CDN or firewall, or add allow rules for the crawlers you want.</p>
          <p><strong>The page is empty without JavaScript.</strong> Render the main copy on the server with server-side rendering or static generation.</p>
          <p><strong>No structured data.</strong> Add a <code>SoftwareApplication</code> or <code>Organization</code> JSON-LD block with your product name, URL and official profiles. The checker generates one for your domain when it is missing.</p>
          <p><strong>noindex or nosnippet.</strong> Remove them from the homepage unless you mean to keep it out of search and AI answers.</p>
        </section>

        <section>
          <h2>AI visibility check vs brand mention tracking</h2>
          <p>This AI visibility check answers a technical question: can AI crawlers get to your content? It cannot tell you whether ChatGPT recommends you, because that depends on what the rest of the web says about your product. Fix access first, since no amount of content helps if crawlers are blocked. Then get your product described on pages AI answers already cite, such as reviews, comparisons and directories.</p>
          <p>If you build an AI tool, an <Link href="/submit">Ordalin listing</Link> is free and researched from your official site.</p>
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
              name: "AI Visibility Checker",
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
