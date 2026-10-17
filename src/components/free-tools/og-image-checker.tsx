"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import { TurnstileBox } from "@/components/submissions/turnstile-box";
import { trackEvent } from "@/lib/analytics";
import type { VisibilityCheck } from "@/lib/free-tools/ai-visibility/checks";
import type { OgCheckReport, OgPreview } from "@/lib/free-tools/og-image/check";
import { CheckItem, statusOrder } from "./ai-visibility-checker";
import shared from "./ai-visibility-checker.module.css";
import styles from "./og-image-checker.module.css";

type Result = { report: OgCheckReport; listing: { slug: string; name: string } | null; inReview: boolean };

function headline(checks: VisibilityCheck[], found: boolean) {
  if (!found) return "The page could not be checked";
  const fix = checks.filter((check) => check.status === "fail").length;
  const improve = checks.filter((check) => check.status === "warn").length;
  if (!fix && !improve) return "No problems found";
  return [fix ? `${fix} to fix` : "", improve ? `${improve} to improve` : ""].filter(Boolean).join(", ");
}

// Without an image the platforms show a text-only card, so draw no image area.
function PreviewImage({ src, className }: { src: string | null; className: string }) {
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element -- the image lives on the checked site, not ours
  return <img className={className} src={src} alt="" loading="lazy" referrerPolicy="no-referrer" />;
}

function Previews({ preview }: { preview: OgPreview }) {
  const title = preview.title ?? preview.domain;
  const xImage = preview.twitterImage ?? preview.image;
  const smallCard = preview.twitterCard === "summary" || !xImage;
  return (
    <section className={styles.previews} aria-label="Link previews">
      <h3 className={styles.previewsHeading}>Link previews</h3>
      <div className={styles.grid}>
        <figure className={styles.platform}>
          <figcaption>X</figcaption>
          {smallCard ? (
            <div className={styles.xSmall} data-image={xImage ? "true" : "false"}>
              <PreviewImage src={xImage} className={styles.xThumb} />
              <div className={styles.text}>
                <span className={styles.muted}>{preview.domain}</span>
                <strong>{title}</strong>
                {preview.description ? <span className={styles.clamp}>{preview.description}</span> : null}
              </div>
            </div>
          ) : (
            <>
              <div className={styles.xLarge}>
                <PreviewImage src={xImage} className={styles.wide2} />
                <span className={styles.xTitle}>{title}</span>
              </div>
              <span className={`${styles.muted} ${styles.below}`}>From {preview.domain}</span>
            </>
          )}
        </figure>

        <figure className={styles.platform}>
          <figcaption>Facebook</figcaption>
          <div className={styles.card}>
            <PreviewImage src={preview.image} className={styles.wide} />
            <div className={`${styles.text} ${styles.fill}`}>
              <span className={styles.upper}>{preview.domain}</span>
              <strong className={styles.clamp}>{title}</strong>
              {preview.description ? <span className={`${styles.muted} ${styles.oneLine}`}>{preview.description}</span> : null}
            </div>
          </div>
        </figure>

        <figure className={styles.platform}>
          <figcaption>LinkedIn</figcaption>
          <div className={styles.card}>
            <PreviewImage src={preview.image} className={styles.wide} />
            <div className={styles.text}>
              <strong className={styles.clamp}>{title}</strong>
              <span className={styles.muted}>{preview.domain}</span>
            </div>
          </div>
        </figure>

        <figure className={styles.platform}>
          <figcaption>Slack</figcaption>
          <div className={styles.slack}>
            <div className={styles.text}>
              <strong>{preview.siteName ?? preview.domain}</strong>
              <span className={styles.link}>{title}</span>
              {preview.description ? <span className={styles.clamp}>{preview.description}</span> : null}
            </div>
            <PreviewImage src={preview.image} className={styles.slackImage} />
          </div>
        </figure>
      </div>
      <p className={shared.caveat}>
        Approximate layouts. Each platform changes its design and caches previews, so an image you just updated can take a while to appear.
      </p>
    </section>
  );
}

export function OgImageChecker({ turnstileSiteKey }: { turnstileSiteKey?: string }) {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [token, setToken] = useState("");
  const [widget, setWidget] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const onToken = useCallback((value: string) => setToken(value), []);

  async function run(target: string) {
    if (!token) {
      setError("Verification is still loading. Try again in a moment.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/free-tools/og-image-check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ websiteUrl: target, turnstileToken: token }),
      });
      const payload = (await response.json()) as Result & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "The check could not be completed.");
      setResult(payload);
      const failed = payload.report.checks.filter((check) => check.status === "fail").length;
      trackEvent("OG Image Check", { found: String(payload.report.found), failed: String(failed) });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The check could not be completed.");
    } finally {
      // Turnstile tokens are single-use; mount a fresh widget for the next check.
      setToken("");
      setWidget((value) => value + 1);
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(websiteUrl);
  }

  const report = result?.report;
  const checks = report ? [...report.checks].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]) : [];

  return (
    <section className={shared.tool} aria-label="OG image checker">
      <form onSubmit={submit}>
        <label className={shared.label} htmlFor="og-check-url">Page URL</label>
        <div className={shared.urlControl}>
          <input
            id="og-check-url"
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="your-product.com/pricing"
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            required
          />
          <button type="submit" disabled={busy}>{busy ? "Checking…" : "Check OG image"}</button>
        </div>
        <TurnstileBox key={widget} siteKey={turnstileSiteKey} onToken={onToken} action="og-check" />
        <p className={shared.hint}>Free, no sign-up. Enter any page; we read its Open Graph tags, load the image and show how the link looks when shared.</p>
        {error ? <p className={shared.error} role="alert">{error}</p> : null}
      </form>

      {report && result ? (
        <div className={shared.report} aria-live="polite">
          <header className={shared.reportHeader}>
            <div>
              <p className={shared.domain}>{report.pageUrl.replace(/^https:\/\//, "")}</p>
              <h2>{headline(report.checks, report.found)}</h2>
              <p className={shared.meta}>Checked {new Date(report.generatedAt).toLocaleString()}</p>
            </div>
            <button type="button" className={shared.secondary} disabled={busy} onClick={() => void run(report.website)}>
              Check again
            </button>
          </header>

          {report.preview ? <Previews preview={report.preview} /> : null}

          <ol className={shared.checks}>{checks.map((check) => <CheckItem key={check.id} check={check} />)}</ol>

          <p className={shared.caveat}>
            Share previews are one part of being found. To see whether AI crawlers can reach your site, run the{" "}
            <Link href="/free-tools/ai-visibility-checker">AI visibility checker</Link>.
          </p>

          <aside className={shared.listing}>
            {result.listing ? (
              <>
                <p><strong>{result.listing.name} is listed on Ordalin.</strong> A directory profile is one more page people and AI answers can find.</p>
                <Link href={`/tools/${result.listing.slug}`}>View the profile</Link>
              </>
            ) : result.inReview ? (
              <p><strong>This site is already submitted to Ordalin</strong> and is being reviewed.</p>
            ) : (
              <>
                <p><strong>Launching an AI tool?</strong> List it on Ordalin for free. Each profile is researched from your official site and links back to it.</p>
                <Link
                  href={`/submit?website=${encodeURIComponent(new URL(report.pageUrl).origin)}`}
                  onClick={() => trackEvent("OG Image Check Submit Click")}
                >
                  Submit this site
                </Link>
              </>
            )}
          </aside>
        </div>
      ) : null}
    </section>
  );
}
