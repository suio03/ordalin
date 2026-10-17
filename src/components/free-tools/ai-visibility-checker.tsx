"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import { TurnstileBox } from "@/components/submissions/turnstile-box";
import { trackEvent } from "@/lib/analytics";
import type { CheckStatus, CrawlerAccess, VisibilityCheck, VisibilityReport } from "@/lib/free-tools/ai-visibility/checks";
import styles from "./ai-visibility-checker.module.css";

type Result = {
  report: VisibilityReport;
  cached: boolean;
  listing: { slug: string; name: string } | null;
  inReview: boolean;
};

const statusLabel: Record<CheckStatus, string> = { fail: "Fix", warn: "Improve", pass: "Pass", info: "Note" };
export const statusOrder: Record<CheckStatus, number> = { fail: 0, warn: 1, pass: 2, info: 3 };
const purposeLabel: Record<CrawlerAccess["purpose"], string> = {
  answers: "AI search and answer crawlers",
  user: "User-triggered fetchers",
  mixed: "Training and Gemini grounding",
  training: "Training-only crawlers",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={styles.copy}
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1_500);
        });
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function CheckItem({ check }: { check: VisibilityCheck }) {
  return (
    <li className={styles.check} data-status={check.status}>
      <span className={styles.status}>{statusLabel[check.status]}</span>
      <div>
        <h3>{check.title}</h3>
        <p>{check.summary}</p>
        {check.fix ? <p className={styles.fix}><strong>How to fix:</strong> {check.fix}</p> : null}
        {check.snippet ? (
          <div className={styles.snippet}>
            <pre><code>{check.snippet}</code></pre>
            <CopyButton text={check.snippet} />
          </div>
        ) : null}
        {check.link ? <p><Link href={check.link.href}>{check.link.label}</Link></p> : null}
        {check.evidence.length ? (
          <details className={styles.evidence}>
            <summary>What we found</summary>
            <ul>{check.evidence.map((line) => <li key={line}>{line}</li>)}</ul>
          </details>
        ) : null}
      </div>
    </li>
  );
}

function CrawlerTable({ crawlers }: { crawlers: CrawlerAccess[] }) {
  const purposes = Object.keys(purposeLabel) as CrawlerAccess["purpose"][];
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption>robots.txt access to the homepage, by crawler</caption>
        <thead>
          <tr><th scope="col">Crawler</th><th scope="col">Used for</th><th scope="col">Access</th></tr>
        </thead>
        {purposes.map((purpose) => (
          <tbody key={purpose}>
            <tr><th scope="rowgroup" colSpan={3}>{purposeLabel[purpose]}</th></tr>
            {crawlers.filter((crawler) => crawler.purpose === purpose).map((crawler) => (
              <tr key={crawler.token}>
                <td><code>{crawler.token}</code><span>{crawler.owner}</span></td>
                <td>{crawler.use}</td>
                <td data-allowed={crawler.allowed}>
                  {crawler.allowed ? "Allowed" : "Blocked"}
                  {crawler.rule ? <span>{crawler.rule}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

export function AiVisibilityChecker({ turnstileSiteKey }: { turnstileSiteKey?: string }) {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [token, setToken] = useState("");
  const [widget, setWidget] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const onToken = useCallback((value: string) => setToken(value), []);

  async function run(target: string, refresh: boolean) {
    if (!token) {
      setError("Verification is still loading. Try again in a moment.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/free-tools/ai-visibility", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ websiteUrl: target, turnstileToken: token, refresh }),
      });
      const payload = (await response.json()) as Result & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "The check could not be completed.");
      setResult(payload);
      const failed = payload.report.checks.filter((check) => check.status === "fail").length;
      trackEvent("AI Visibility Check", { failed: String(failed), refresh: String(refresh) });
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
    void run(websiteUrl, false);
  }

  const report = result?.report;
  const checks = report ? [...report.checks].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]) : [];

  return (
    <section className={styles.tool} aria-label="AI visibility checker">
      <form onSubmit={submit}>
        <label className={styles.label} htmlFor="ai-visibility-url">Your website</label>
        <div className={styles.urlControl}>
          <input
            id="ai-visibility-url"
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="your-product.com"
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            required
          />
          <button type="submit" disabled={busy}>{busy ? "Checking…" : "Check AI visibility"}</button>
        </div>
        <TurnstileBox key={widget} siteKey={turnstileSiteKey} onToken={onToken} action="ai-visibility" />
        <p className={styles.hint}>Free, no sign-up. We read your robots.txt, homepage, llms.txt and sitemap the way AI crawlers do.</p>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
      </form>

      {report && result ? (
        <div className={styles.report} aria-live="polite">
          <header className={styles.reportHeader}>
            <div>
              <p className={styles.domain}>{report.domain}</p>
              <h2>{report.passed} of {report.scored} checks passed</h2>
              <p className={styles.meta}>
                Checked {new Date(report.checkedAt).toLocaleString()}
                {result.cached ? " · saved result" : ""}
              </p>
            </div>
            <button type="button" className={styles.secondary} disabled={busy} onClick={() => void run(report.website, true)}>
              Re-check now
            </button>
          </header>

          <ol className={styles.checks}>{checks.map((check) => <CheckItem key={check.id} check={check} />)}</ol>

          {report.crawlers.length ? <CrawlerTable crawlers={report.crawlers} /> : null}

          <p className={styles.caveat}>
            The crawler response test runs from Ordalin&apos;s servers with each crawler&apos;s user agent. Firewalls that verify crawlers by IP address may treat the real crawlers differently.
          </p>

          <aside className={styles.listing}>
            {result.listing ? (
              <>
                <p><strong>{result.listing.name} is listed on Ordalin.</strong> A directory profile is one more page AI answers can find and cite.</p>
                <Link href={`/tools/${result.listing.slug}`}>View the profile</Link>
              </>
            ) : result.inReview ? (
              <p><strong>This site is already submitted to Ordalin</strong> and is being reviewed.</p>
            ) : (
              <>
                <p><strong>Building an AI tool?</strong> List it on Ordalin for free. Each profile is researched from your official site and gives AI answers another page to cite.</p>
                <Link
                  href={`/submit?website=${encodeURIComponent(report.website)}`}
                  onClick={() => trackEvent("AI Visibility Submit Click")}
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
