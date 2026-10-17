import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/agents/json-ld";
import { OgImageChecker } from "@/components/free-tools/og-image-checker";
import styles from "@/components/directory/catalog-page.module.css";
import guide from "@/components/free-tools/ai-visibility-checker.module.css";
import { withSocial } from "@/lib/seo";

const PATH = "/free-tools/og-image-checker";
const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "https://ordalin.com";

export const metadata: Metadata = withSocial({
  alternates: { canonical: PATH },
  title: { absolute: "Free OG Image Checker: Test Open Graph Tags & Previews | Ordalin" },
  description:
    "Free OG image checker. Enter a URL to test its Open Graph tags, check the og:image size and format, and preview the link on X, Facebook, LinkedIn and Slack.",
});

const tags = `<meta property="og:title" content="Acme: meeting notes for product teams" />
<meta property="og:description" content="Acme turns meetings into searchable notes." />
<meta property="og:url" content="https://acme.com/" />
<meta property="og:image" content="https://acme.com/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Acme meeting notes on a laptop" />
<meta name="twitter:card" content="summary_large_image" />`;

const faq = [
  {
    q: "Is this OG image checker free?",
    a: "Yes. There is no sign-up. Each visitor can run 10 checks an hour so the tool stays available for everyone.",
  },
  {
    q: "Is an OG image checker the same as an Open Graph checker?",
    a: "Yes. Both test the Open Graph tags that control link previews. This tool checks all of them, with extra checks on the image itself: whether it loads, its real size, format and file size.",
  },
  {
    q: "Why does Facebook or LinkedIn still show my old image?",
    a: "Platforms cache previews. Use Facebook's Sharing Debugger or LinkedIn's Post Inspector to fetch the page again. For other platforms, give the new image a new file name or add a version such as ?v=2 to its URL.",
  },
  {
    q: "Does the checker run JavaScript?",
    a: "No, and neither do the crawlers of X, Facebook, LinkedIn or Slack. If your Open Graph tags are added by JavaScript after the page loads, the checker and the platforms will not see them.",
  },
  {
    q: "Do you store the pages I check?",
    a: "No. Checks are not cached and the page is not saved. We keep a hashed, unreadable record of your IP address for up to a day for rate limiting.",
  },
];

export default function OgImageCheckerPage() {
  return (
    <main className={styles.main}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Free tool</p>
          <h1>OG Image Checker</h1>
          <p className={styles.description}>
            See how a link looks when it is shared. Enter a page to check its Open Graph tags, test the og:image size and format, and preview the card on X, Facebook, LinkedIn and Slack.
          </p>
        </div>
      </header>

      <OgImageChecker turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />

      <div className={`${styles.prose} ${guide.guide}`}>
        <section>
          <h2>How to check the OG image of a page</h2>
          <p>Enter the page in the checker above. It reads the page&apos;s Open Graph tags, loads the og:image file and shows how the link will look on each platform, with a list of what to fix.</p>
          <p>To check by hand, open the page, view its source and search for <code>og:image</code>. Then open the image address in a new tab to make sure it loads. Facebook&apos;s Sharing Debugger and LinkedIn&apos;s Post Inspector show how those two platforms read a page, and let you refresh their cached preview.</p>
        </section>

        <section>
          <h2>What size should an OG image be?</h2>
          <p>Use <strong>1200 × 630 pixels</strong>, a 1.91:1 ratio, saved as PNG or JPEG and well under 5 MB. That size shows as a large card on every major platform. Keep text and logos near the centre, because some platforms crop the edges.</p>
          <ul>
            <li><strong>Facebook:</strong> images smaller than 600 × 315 show as a small thumbnail, and images under 200 × 200 are not shown.</li>
            <li><strong>X:</strong> with <code>summary_large_image</code>, the image is shown at 2:1 and must be under 5 MB. SVG is not supported.</li>
            <li><strong>LinkedIn:</strong> recommends 1200 × 627, close enough that 1200 × 630 works.</li>
            <li><strong>Slack, Discord and iMessage:</strong> read the same tags; 1200 × 630 works for all of them.</li>
          </ul>
        </section>

        <section>
          <h2>The Open Graph tags every page needs</h2>
          <p>Put these tags in the page&apos;s <code>&lt;head&gt;</code>, in the HTML the server sends. <code>og:title</code>, <code>og:image</code> and <code>og:url</code> do most of the work; <code>twitter:card</code> makes X show a large image. X reads the title, description and image from the Open Graph tags, so you do not need separate <code>twitter:</code> versions of them.</p>
          <pre><code>{tags}</code></pre>
        </section>

        <section>
          <h2>What this OG image checker tests</h2>
          <ul>
            <li><strong>The og:image tag.</strong> That the page has one, with a full https:// URL.</li>
            <li><strong>The image.</strong> That it loads, its real size in pixels, its ratio, format and file size, and whether <code>og:image:width</code> and <code>og:image:height</code> match it.</li>
            <li><strong>Title and description.</strong> That <code>og:title</code> and <code>og:description</code> exist, and how long they are.</li>
            <li><strong>og:url.</strong> That it is set and matches the canonical URL.</li>
            <li><strong>X card.</strong> That <code>twitter:card</code> is set, and that a separate <code>twitter:image</code> loads.</li>
          </ul>
          <p>Every check is a fixed rule; no AI reviews your page.</p>
        </section>

        <section>
          <h2>Common OG image problems and how to fix them</h2>
          <h3>The link shows no image</h3>
          <p>Usually the page has no <code>og:image</code>, the address is wrong, or the image returns an error. Less often, bot protection or a firewall blocks the platforms&apos; crawlers. Allow <code>facebookexternalhit</code>, <code>Twitterbot</code>, <code>LinkedInBot</code> and <code>Slackbot</code>.</p>
          <h3>The tags are added by JavaScript</h3>
          <p>Link-preview crawlers do not run JavaScript. In a single-page app, render the tags on the server or at build time, for example with your framework&apos;s metadata API.</p>
          <h3>og:image is a relative path</h3>
          <p>Write <code>https://acme.com/og.png</code>, not <code>/og.png</code>. The Open Graph protocol expects full URLs.</p>
          <h3>The image is cropped or blurry</h3>
          <p>Square and tall images are cropped to a wide card, and small images are stretched. Export at 1200 × 630.</p>
          <h3>The old image still shows</h3>
          <p>Platforms cache previews. Refresh them in Facebook&apos;s Sharing Debugger or LinkedIn&apos;s Post Inspector, or change the image file name.</p>
        </section>

        <section>
          <h2>FAQ</h2>
          {faq.map((item) => (
            <div key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
          <p>
            More free tools: the <Link href="/free-tools/ai-visibility-checker">AI visibility checker</Link> and the{" "}
            <Link href="/free-tools/llms-txt-generator">llms.txt generator</Link>. If you build an AI tool, an <Link href="/submit">Ordalin listing</Link> is free.
          </p>
        </section>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebApplication",
              name: "OG Image Checker",
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
