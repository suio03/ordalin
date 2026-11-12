import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/agents/json-ld";
import { AiMetadataRemover } from "@/components/free-tools/ai-metadata-remover";
import { AI_METADATA_LIMITS } from "@/lib/free-tools/ai-metadata/limits";
import styles from "@/components/directory/catalog-page.module.css";
import guide from "@/components/free-tools/ai-visibility-checker.module.css";
import { withSocial } from "@/lib/seo";

const PATH = "/free-tools/ai-metadata-remover";
const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "https://ordalin.com";

export const metadata: Metadata = withSocial({
  alternates: { canonical: PATH },
  title: { absolute: "AI Metadata Remover: View and Remove AI Metadata From Images | Ordalin" },
  description:
    "Free AI metadata remover. See the C2PA, XMP, EXIF and prompt data an AI image carries, then remove all of it or only the AI fields. Runs in your browser, lossless, JPG to AVIF.",
});

const faq = [
  {
    q: "What is AI metadata?",
    a: "Information an AI image tool writes into the file next to the picture: which generator made it, a marker that it was made or edited by AI, and sometimes the full prompt and settings. It is invisible when you look at the image but readable by any software, including social platforms.",
  },
  {
    q: "How do I check if an image has AI metadata?",
    a: "Drop it in the tool above. The scan lists every metadata block and marks the fields that point to AI, with the reason for each. It also lists personal data such as GPS location and camera model.",
  },
  {
    q: "Does removing metadata change the image?",
    a: "No. Metadata blocks are removed and the image data is copied byte for byte, without re-encoding. The tool compares the image data before and after and tells you if anything differs.",
  },
  {
    q: "Which formats are supported?",
    a: `JPG, PNG, WebP, HEIC and AVIF. Each file comes back in the same format. Up to ${AI_METADATA_LIMITS.files} files at a time, ${AI_METADATA_LIMITS.mb} MB each, and a ZIP download for batches.`,
  },
  {
    q: "Are my files sent anywhere?",
    a: "No. Reading and cleaning happen in your browser, so the files never reach Ordalin's servers. We count downloads by format and result only, never file names or contents.",
  },
  {
    q: "Can I remove the AI watermark too?",
    a: "No tool that keeps the image unchanged can. Watermarks such as Google SynthID are hidden in the pixels themselves, not in the metadata. This tool removes the metadata and tells you when a file says a pixel watermark was added.",
  },
];

export default function AiMetadataRemoverPage() {
  return (
    <main className={styles.main}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Free tool</p>
          <h1>AI Metadata Remover</h1>
          <p className={styles.description}>
            See what an image says about how it was made: generator, AI markers, prompt, location and camera. Then remove all metadata, or only the AI fields, without touching a pixel.
          </p>
        </div>
      </header>

      <AiMetadataRemover variant="metadata" />

      <div className={`${styles.prose} ${guide.guide}`}>
        <section>
          <h2>How to remove AI metadata from an image</h2>
          <ol>
            <li><strong>Drop one or more images</strong> in the box above. Each file is scanned as soon as it is added.</li>
            <li><strong>Check what the file carries.</strong> AI fields are listed first with the reason they count; open &ldquo;All metadata&rdquo; to see every block and field.</li>
            <li><strong>Pick a mode.</strong> &ldquo;Remove all metadata&rdquo; leaves only the orientation and color profile, so the image still displays correctly. &ldquo;Remove AI fields only&rdquo; keeps camera, date and location.</li>
            <li><strong>Clean, check, download.</strong> The cleaned file is scanned again before you download it, so you can see that nothing AI-related is left.</li>
          </ol>
        </section>

        <section>
          <h2>Where AI metadata hides in a file</h2>
          <p>These are the blocks the tool checks for data written by <Link href="/categories/image/image-generation">AI image generators</Link> and AI editing features:</p>
          <table>
            <thead>
              <tr>
                <th>Block</th>
                <th>What AI tools write there</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>C2PA (Content Credentials)</td>
                <td>A signed manifest: the generator, the model, the actions taken, and the source type. Written by OpenAI, Google, Adobe and ByteDance.</td>
              </tr>
              <tr>
                <td>XMP</td>
                <td>IPTC Digital Source Type (<code>trainedAlgorithmicMedia</code>), creator tool and credit lines such as &ldquo;Made with Google AI&rdquo;.</td>
              </tr>
              <tr>
                <td>EXIF</td>
                <td>Software, image description or artist fields naming the generator.</td>
              </tr>
              <tr>
                <td>PNG text chunks</td>
                <td>The prompt, negative prompt, seed and sampler (Stable Diffusion WebUI <code>parameters</code>), or the whole node graph (ComfyUI <code>prompt</code> and <code>workflow</code>).</td>
              </tr>
              <tr>
                <td>IPTC and comments</td>
                <td>Older caption and credit fields, sometimes a generator name.</td>
              </tr>
            </tbody>
          </table>
          <p>The tool reads all of these in JPG, PNG, WebP, HEIC and AVIF, including C2PA stored in HEIC and AVIF item boxes. It also searches the raw bytes for AI markers outside any known block, and reports them if a file still has them after cleaning.</p>
        </section>

        <section>
          <h2>Remove all metadata or only the AI fields?</h2>
          <p><strong>Remove all metadata</strong> is the safer default for anything you post publicly. It also removes GPS coordinates, the camera or phone model and serial number, the date taken and author names. The orientation tag stays so the image is not shown sideways, and the color profile stays so colors do not shift.</p>
          <p><strong>Remove AI fields only</strong> suits photographers who used an AI edit on a real photo and want to keep their camera data and copyright notice. C2PA is always removed in this mode. Other blocks are removed only when they hold an AI field, and AI values inside EXIF are cleared in place, so the rest of the EXIF stays.</p>
        </section>

        <section>
          <h2>Why remove AI metadata</h2>
          <ul>
            <li><strong>Privacy.</strong> The prompt, your file paths, the location and the device can all be read by anyone who downloads the image.</li>
            <li><strong>Edited photos labelled as AI.</strong> One generative fill writes the same markers as a fully generated image, and platforms label both. See the <Link href="/free-tools/ai-label-remover">AI label remover</Link> for how platform labels work.</li>
            <li><strong>Clean deliverables.</strong> Stock sites, clients and print shops often want files without tool and prompt data.</li>
          </ul>
          <p>Metadata is not proof either way: removing it does not make an image real, and an image without it may still be AI-made. Where a platform or client requires you to disclose AI use, removing the metadata does not change that.</p>
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
            Working with an AI agent? The <Link href="/skills/watermarks-remover">Watermarks Remover skill</Link> cleans C2PA data and hidden characters from the command line. More free tools: the{" "}
            <Link href="/free-tools/og-image-checker">OG image checker</Link> and the <Link href="/free-tools/llms-txt-generator">llms.txt generator</Link>, or browse the <Link href="/">Ordalin AI tool directory</Link>.
          </p>
        </section>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebApplication",
              name: "AI Metadata Remover",
              url: `${SITE}${PATH}`,
              applicationCategory: "MultimediaApplication",
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
