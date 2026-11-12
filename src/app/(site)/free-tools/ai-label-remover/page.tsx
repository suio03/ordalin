import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/agents/json-ld";
import { AiMetadataRemover } from "@/components/free-tools/ai-metadata-remover";
import { AI_METADATA_LIMITS } from "@/lib/free-tools/ai-metadata/limits";
import styles from "@/components/directory/catalog-page.module.css";
import guide from "@/components/free-tools/ai-visibility-checker.module.css";
import { withSocial } from "@/lib/seo";

const PATH = "/free-tools/ai-label-remover";
const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "https://ordalin.com";

export const metadata: Metadata = withSocial({
  alternates: { canonical: PATH },
  title: { absolute: "Remove AI Label From Images: Free AI Label and Tag Remover | Ordalin" },
  description:
    "Remove the AI label from images for free. See which hidden fields make Instagram, Facebook, Threads or TikTok tag your image as AI, then strip them in your browser. An AI tag remover with no upload and no quality loss.",
});

const faq = [
  {
    q: "Will this remove the AI label from my post?",
    a: "It removes the metadata that platforms read to add the label automatically. If the label came from that metadata, a cleaned file uploaded as a new post should not get it. It cannot change a label on a post that is already up, and it cannot remove a label caused by an invisible watermark, by the platform's own image detection, or by a disclosure you ticked when posting.",
  },
  {
    q: "Is the AI label remover free?",
    a: `Yes, with no sign-up and no watermark. You can clean up to ${AI_METADATA_LIMITS.files} images at a time, up to ${AI_METADATA_LIMITS.mb} MB each.`,
  },
  {
    q: "Are my images uploaded?",
    a: "No. The images are read and cleaned in your browser, so they never reach Ordalin's servers. The page counts downloads by format and result (for example \"JPG, AI metadata found\"), never file names or contents.",
  },
  {
    q: "Does removing the AI tag reduce image quality?",
    a: "No. The tool removes metadata blocks and copies the image data unchanged, without re-encoding. After cleaning it checks that the image bytes are identical to the original.",
  },
  {
    q: "Why does my photo get an AI label when I only edited it?",
    a: "Editors with generative features, such as generative fill in Photoshop, write a \"composite with AI\" marker or a C2PA manifest into the file. Platforms treat that the same as a fully generated image. Scan the photo to see which field it is.",
  },
  {
    q: "Is it allowed to remove the AI label?",
    a: "Removing metadata from your own files is legal, but Meta and TikTok ask you to disclose realistic AI-made content yourself, and removing the label does not change that rule. Use the tool for false labels, such as edited photos, and for privacy, not to pass off realistic AI images as real.",
  },
];

export default function AiLabelRemoverPage() {
  return (
    <main className={styles.main}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Free tool</p>
          <h1>AI Label Remover</h1>
          <p className={styles.description}>
            Find out why an image gets an &ldquo;AI info&rdquo; or &ldquo;AI-generated&rdquo; label, then remove the hidden fields that trigger it. Everything runs in your browser and the image itself is not changed.
          </p>
        </div>
      </header>

      <AiMetadataRemover variant="label" />

      <div className={`${styles.prose} ${guide.guide}`}>
        <section>
          <h2>How to remove the AI label from an image</h2>
          <ol>
            <li><strong>Add the image.</strong> Drop it in the box above, or several at once. The tool scans each file right away.</li>
            <li><strong>Read the result.</strong> &ldquo;AI metadata found&rdquo; or &ldquo;Content Credentials found&rdquo; means the file carries the fields platforms look for, and the list shows each one and why it counts.</li>
            <li><strong>Choose what to keep.</strong> &ldquo;Remove all metadata&rdquo; also strips GPS and camera data. &ldquo;Remove AI fields only&rdquo; keeps them.</li>
            <li><strong>Clean and download.</strong> The tool scans the cleaned file again and shows whether anything is left, then you download it.</li>
            <li><strong>Post the cleaned file as a new post.</strong> Editing an existing post does not remove its label.</li>
          </ol>
        </section>

        <section>
          <h2>Why platforms add an AI label</h2>
          <p>Most automatic AI labels come from information written inside the file, not from looking at the picture. Meta (Instagram, Facebook, Threads) and TikTok read two industry standards:</p>
          <ul>
            <li><strong>C2PA Content Credentials.</strong> A signed record that says which tool made the image and how. OpenAI, Google, Adobe and ByteDance add it to generated images.</li>
            <li><strong>IPTC Digital Source Type.</strong> An XMP field whose value <code>trainedAlgorithmicMedia</code> means &ldquo;made by AI&rdquo;, and <code>compositeWithTrainedAlgorithmicMedia</code> means &ldquo;edited with AI&rdquo;.</li>
          </ul>
          <p>Meta shows the label as &ldquo;AI info&rdquo;: on the post for content made with AI, and in the post menu for content edited with AI. TikTok shows &ldquo;AI-generated&rdquo;. When these fields are gone, the automatic metadata check has nothing to read.</p>
        </section>

        <section>
          <h2>What this tool can and cannot remove</h2>
          <table>
            <thead>
              <tr>
                <th>Where the label comes from</th>
                <th>Removed?</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>C2PA manifest (Content Credentials)</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td>XMP and IPTC fields: Digital Source Type, creator tool, credit</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td>EXIF Software or description naming an AI generator</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td>PNG text with the prompt (Stable Diffusion, ComfyUI)</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td>Invisible watermarks in the pixels, such as Google SynthID</td>
                <td>No</td>
              </tr>
              <tr>
                <td>The platform&apos;s own visual AI detection</td>
                <td>No</td>
              </tr>
              <tr>
                <td>The AI disclosure you chose when posting</td>
                <td>No: turn it off in the post settings</td>
              </tr>
            </tbody>
          </table>
          <p>Google&apos;s Gemini images, for example, carry a C2PA note that says &ldquo;Applied imperceptible SynthID watermark.&rdquo; The tool removes the note, but the watermark is part of the pixels and stays. Changing the pixels to defeat it would mean re-encoding or altering the image, which this tool never does.</p>
        </section>

        <section>
          <h2>What the scan shows for common AI tools</h2>
          <p>Results from real files we scanned with this tool, from popular <Link href="/categories/image/image-generation">AI image generators</Link> and from ordinary cameras:</p>
          <ul>
            <li><strong>ChatGPT and the OpenAI image API:</strong> a C2PA manifest naming the OpenAI service and the gpt-image model, with the AI source type.</li>
            <li><strong>Google Gemini (Nano Banana):</strong> C2PA actions &ldquo;Created by Google Generative AI.&rdquo; and the SynthID note.</li>
            <li><strong>ByteDance Seedream (Doubao, Dreamina):</strong> a C2PA manifest naming Volcengine and the Seedream model.</li>
            <li><strong>Phone and camera photos:</strong> camera, date and often GPS fields, but no AI fields. If such a photo is labelled, the label did not come from its metadata.</li>
          </ul>
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
            Want to see every field in a file, or strip location and camera data as well? Use the <Link href="/free-tools/ai-metadata-remover">AI metadata remover</Link>. To clean files from an AI agent instead, see the{" "}
            <Link href="/skills/watermarks-remover">Watermarks Remover skill</Link>. More free tools: the <Link href="/free-tools/og-image-checker">OG image checker</Link> and the{" "}
            <Link href="/free-tools/ai-visibility-checker">AI visibility checker</Link>, or browse the <Link href="/">Ordalin AI tool directory</Link>.
          </p>
        </section>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebApplication",
              name: "AI Label Remover",
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
