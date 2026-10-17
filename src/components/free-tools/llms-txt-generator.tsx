"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import { TurnstileBox } from "@/components/submissions/turnstile-box";
import { trackEvent } from "@/lib/analytics";
import { formatHints, renderLlmsTxt, sectionOrder, type LlmsDraft, type LlmsPage, type Section } from "@/lib/free-tools/llms-txt/format";
import shared from "./ai-visibility-checker.module.css";
import styles from "./llms-txt-generator.module.css";

type Result = {
  draft: LlmsDraft;
  cached: boolean;
  listing: { slug: string; name: string } | null;
  inReview: boolean;
};

type Row = LlmsPage & { choice: Section | "remove" };

const sourceLabel: Record<LlmsDraft["source"], string> = {
  sitemap: "from your sitemap",
  "homepage-links": "from links on your homepage (no sitemap found)",
};

function rowsFor(draft: LlmsDraft): Row[] {
  return draft.pages.map((page) => ({ ...page, choice: page.section }));
}

function fileFor(draft: LlmsDraft, rows: Row[]) {
  const pages = rows.flatMap((row) => (row.choice === "remove" ? [] : [{ ...row, section: row.choice }]));
  return renderLlmsTxt({ name: draft.name, summary: draft.summary, pages });
}

function displayPath(url: string) {
  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

export function LlmsTxtGenerator({ turnstileSiteKey }: { turnstileSiteKey?: string }) {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [token, setToken] = useState("");
  const [widget, setWidget] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [text, setText] = useState("");
  const [edited, setEdited] = useState(false);
  const [copied, setCopied] = useState(false);
  const onToken = useCallback((value: string) => setToken(value), []);

  async function run(target: string, refresh: boolean) {
    if (!token) {
      setError("Verification is still loading. Try again in a moment.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/free-tools/llms-txt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ websiteUrl: target, turnstileToken: token, refresh }),
      });
      const payload = (await response.json()) as Result & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "The file could not be generated.");
      const nextRows = rowsFor(payload.draft);
      setResult(payload);
      setRows(nextRows);
      setText(fileFor(payload.draft, nextRows));
      setEdited(false);
      trackEvent("LLMs.txt Generate", { pages: String(payload.draft.pages.length), refresh: String(refresh) });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The file could not be generated.");
    } finally {
      // Turnstile tokens are single-use; mount a fresh widget for the next request.
      setToken("");
      setWidget((value) => value + 1);
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(websiteUrl, false);
  }

  function choose(index: number, choice: Row["choice"]) {
    if (!result) return;
    const nextRows = rows.map((row, rowIndex) => (rowIndex === index ? { ...row, choice } : row));
    setRows(nextRows);
    setText(fileFor(result.draft, nextRows));
    setEdited(false);
  }

  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "llms.txt";
    link.click();
    URL.revokeObjectURL(url);
    trackEvent("LLMs.txt Download");
  }

  const draft = result?.draft;
  const hints = draft ? formatHints(text) : [];

  return (
    <section className={shared.tool} aria-label="llms.txt generator">
      <form onSubmit={submit}>
        <label className={shared.label} htmlFor="llms-txt-url">Your website</label>
        <div className={shared.urlControl}>
          <input
            id="llms-txt-url"
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="your-product.com"
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            required
          />
          <button type="submit" disabled={busy}>{busy ? "Reading your site…" : "Generate llms.txt"}</button>
        </div>
        <TurnstileBox key={widget} siteKey={turnstileSiteKey} onToken={onToken} action="llms-txt" />
        <p className={shared.hint}>Free, no sign-up. We read your sitemap and each page&apos;s title and meta description. Nothing is written by AI.</p>
        {error ? <p className={shared.error} role="alert">{error}</p> : null}
      </form>

      {draft && result ? (
        <div className={shared.report} aria-live="polite">
          <header className={shared.reportHeader}>
            <div>
              <p className={shared.domain}>{draft.domain}</p>
              <h2>{draft.pages.length} pages {draft.source === "sitemap" ? "found" : "linked"}</h2>
              <p className={shared.meta}>
                {sourceLabel[draft.source]} · {new Date(draft.generatedAt).toLocaleString()}
                {result.cached ? " · saved result" : ""}
              </p>
            </div>
            <button type="button" className={shared.secondary} disabled={busy} onClick={() => void run(draft.website, true)}>
              Rebuild now
            </button>
          </header>

          <div className={styles.workspace}>
            <div>
              <h3 className={styles.heading}>Pages in the file</h3>
              {rows.length ? (
                <ul className={styles.rows}>
                  {rows.map((row, index) => (
                    <li key={row.url} className={styles.row} data-removed={row.choice === "remove"}>
                      <div>
                        <strong>{row.title}</strong>
                        <span>{displayPath(row.url)}</span>
                        {!row.description ? <em>No meta description. Add a note by hand if it helps.</em> : null}
                      </div>
                      <select
                        aria-label={`Section for ${row.title}`}
                        value={row.choice}
                        onChange={(event) => choose(index, event.target.value as Row["choice"])}
                      >
                        {sectionOrder.map((section) => <option key={section} value={section}>{section}</option>)}
                        <option value="remove">Leave out</option>
                      </select>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={shared.meta}>We found no pages to list. The file has your site name and summary; add links by hand.</p>
              )}
              {draft.excluded.length || draft.omitted ? (
                <details className={shared.evidence}>
                  <summary>
                    {draft.excluded.length} left out{draft.omitted ? `, ${draft.omitted} over the page limit` : ""}
                  </summary>
                  <ul>{draft.excluded.map((page) => <li key={page.url}>{displayPath(page.url)}: {page.reason}</li>)}</ul>
                  {draft.omitted ? <p>We list up to 30 pages: top-level pages first, a few from each folder and the six newest blog posts. Add others by hand if they matter.</p> : null}
                </details>
              ) : null}
            </div>

            <div>
              <h3 className={styles.heading}>Your llms.txt</h3>
              <textarea
                className={styles.file}
                aria-label="llms.txt contents"
                spellCheck={false}
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  setEdited(true);
                }}
              />
              {edited ? <p className={shared.meta}>Changing a section above rebuilds the file and replaces your edits.</p> : null}
              <div className={styles.actions}>
                <button type="button" className={styles.primary} onClick={download}>Download llms.txt</button>
                <button
                  type="button"
                  className={shared.secondary}
                  onClick={() => {
                    void navigator.clipboard?.writeText(text).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1_500);
                    });
                  }}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <ul className={styles.hints}>
                {hints.map((hint) => <li key={hint.text} data-ok={hint.ok}>{hint.ok ? "✓" : "!"} {hint.text}</li>)}
              </ul>
              <p className={shared.meta}>
                Upload it so it loads at <code>{draft.website}llms.txt</code>. <a href="#upload">Where to upload llms.txt</a>. Already have a file? <Link href="/free-tools/llms-txt-checker">Check it</Link>.
              </p>
            </div>
          </div>

          <p className={shared.caveat}>
            Want to know whether AI crawlers can read the pages you listed? Run the <Link href="/free-tools/ai-visibility-checker">AI visibility checker</Link>.
          </p>

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
                  href={`/submit?website=${encodeURIComponent(draft.website)}`}
                  onClick={() => trackEvent("LLMs.txt Submit Click")}
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
