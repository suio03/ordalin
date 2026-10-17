"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import { TurnstileBox } from "@/components/submissions/turnstile-box";
import { trackEvent } from "@/lib/analytics";
import type { VisibilityCheck } from "@/lib/free-tools/ai-visibility/checks";
import type { LlmsCheckReport } from "@/lib/free-tools/llms-txt/check";
import { validateLlmsTxt } from "@/lib/free-tools/llms-txt/validate";
import { CheckItem, statusOrder } from "./ai-visibility-checker";
import shared from "./ai-visibility-checker.module.css";
import editor from "./llms-txt-generator.module.css";
import styles from "./llms-txt-checker.module.css";

type Mode = "url" | "paste";

type Result = {
  mode: Mode;
  report: Pick<LlmsCheckReport, "found" | "checks" | "linksChecked" | "linksTotal" | "generatedAt"> & Partial<Pick<LlmsCheckReport, "website" | "fileUrl">>;
  listing: { slug: string; name: string } | null;
  inReview: boolean;
};

function headline(checks: VisibilityCheck[], found: boolean) {
  if (!found) return "No llms.txt file found";
  const fix = checks.filter((check) => check.status === "fail").length;
  const improve = checks.filter((check) => check.status === "warn").length;
  if (!fix && !improve) return "No problems found";
  return [fix ? `${fix} to fix` : "", improve ? `${improve} to improve` : ""].filter(Boolean).join(", ");
}

export function LlmsTxtChecker({ turnstileSiteKey }: { turnstileSiteKey?: string }) {
  const [mode, setMode] = useState<Mode>("url");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [pasted, setPasted] = useState("");
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
      const response = await fetch("/api/free-tools/llms-txt-check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ websiteUrl: target, turnstileToken: token }),
      });
      const payload = (await response.json()) as Omit<Result, "mode"> & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "The check could not be completed.");
      setResult({ ...payload, mode: "url" });
      const failed = payload.report.checks.filter((check) => check.status === "fail").length;
      trackEvent("LLMs.txt Check", { mode: "url", found: String(payload.report.found), failed: String(failed) });
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
    setError("");
    if (mode === "url") {
      void run(websiteUrl);
      return;
    }
    const checks = validateLlmsTxt(pasted);
    setResult({
      mode: "paste",
      report: { found: true, checks, linksChecked: 0, linksTotal: 0, generatedAt: new Date().toISOString() },
      listing: null,
      inReview: false,
    });
    trackEvent("LLMs.txt Check", { mode: "paste", found: "true", failed: String(checks.filter((check) => check.status === "fail").length) });
  }

  const report = result?.report;
  const checks = report ? [...report.checks].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]) : [];

  return (
    <section className={shared.tool} aria-label="llms.txt checker">
      <div className={styles.modes} role="group" aria-label="What to check">
        <button type="button" aria-pressed={mode === "url"} onClick={() => setMode("url")}>Check a website</button>
        <button type="button" aria-pressed={mode === "paste"} onClick={() => setMode("paste")}>Paste the file</button>
      </div>

      <form onSubmit={submit}>
        {mode === "url" ? (
          <>
            <label className={shared.label} htmlFor="llms-check-url">Your website</label>
            <div className={shared.urlControl}>
              <input
                id="llms-check-url"
                type="text"
                inputMode="url"
                autoComplete="url"
                placeholder="your-product.com"
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                required
              />
              <button type="submit" disabled={busy}>{busy ? "Checking…" : "Check llms.txt"}</button>
            </div>
            <TurnstileBox key={widget} siteKey={turnstileSiteKey} onToken={onToken} action="llms-check" />
            <p className={shared.hint}>Free, no sign-up. We load your-site/llms.txt, check its format and test the first 20 links.</p>
          </>
        ) : (
          <>
            <label className={shared.label} htmlFor="llms-check-text">Your llms.txt</label>
            <textarea
              id="llms-check-text"
              className={`${editor.file} ${styles.paste}`}
              spellCheck={false}
              placeholder={"# Your product\n\n> One line about what it does.\n\n## Docs\n\n- [Getting started](https://your-product.com/docs): Set up in five minutes"}
              value={pasted}
              onChange={(event) => setPasted(event.target.value)}
              required
            />
            <div className={editor.actions}>
              <button type="submit" className={editor.primary}>Check the file</button>
            </div>
            <p className={shared.hint}>Checked in your browser; the text is not sent anywhere. Links are only tested when you check a website.</p>
          </>
        )}
        {error ? <p className={shared.error} role="alert">{error}</p> : null}
      </form>

      {report && result ? (
        <div className={shared.report} aria-live="polite">
          <header className={shared.reportHeader}>
            <div>
              <p className={shared.domain}>{result.mode === "url" && report.fileUrl ? report.fileUrl.replace(/^https:\/\//, "") : "Pasted file"}</p>
              <h2>{headline(report.checks, report.found)}</h2>
              <p className={shared.meta}>
                Checked {new Date(report.generatedAt).toLocaleString()}
                {report.linksTotal ? ` · ${report.linksChecked} of ${report.linksTotal} links tested` : ""}
              </p>
            </div>
            {result.mode === "url" && report.website ? (
              <button type="button" className={shared.secondary} disabled={busy} onClick={() => void run(report.website ?? websiteUrl)}>
                Check again
              </button>
            ) : null}
          </header>

          <ol className={shared.checks}>{checks.map((check) => <CheckItem key={check.id} check={check} />)}</ol>

          <p className={shared.caveat}>
            {report.found
              ? <>Want a fresh draft built from your sitemap? Use the <Link href="/free-tools/llms-txt-generator">llms.txt generator</Link>. To see whether AI crawlers can reach your pages at all, run the <Link href="/free-tools/ai-visibility-checker">AI visibility checker</Link>.</>
              : <>The <Link href="/free-tools/llms-txt-generator">llms.txt generator</Link> builds a first draft from your sitemap in a few seconds.</>}
          </p>

          {result.mode === "url" && report.website ? (
            <aside className={shared.listing}>
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
                    onClick={() => trackEvent("LLMs.txt Check Submit Click")}
                  >
                    Submit this site
                  </Link>
                </>
              )}
            </aside>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
