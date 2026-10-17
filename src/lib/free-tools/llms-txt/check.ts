import type { FetchedResource, VisibilityCheck } from "@/lib/free-tools/ai-visibility/checks";
import { browserUserAgent } from "@/lib/free-tools/ai-visibility/crawlers";
import { fetchResource } from "@/lib/free-tools/ai-visibility/fetch";
import { pool } from "./generate";
import { parseLlmsTxt, validateLlmsTxt, type LlmsLink } from "./validate";

const FILE_BYTES = 512_000;
const LINK_LIMIT = 20;
const CONCURRENCY = 6;
// Cloudflare's lowest plan allows 50 subrequests per request; redirects count too.
const SUBREQUEST_BUDGET = 45;

export type LlmsCheckReport = {
  website: string;
  fileUrl: string;
  /** False when /llms.txt is missing or is not a text file; only the delivery check is reported. */
  found: boolean;
  checks: VisibilityCheck[];
  linksChecked: number;
  linksTotal: number;
  generatedAt: string;
};

const ok = (resource: FetchedResource) => resource.status !== null && resource.status >= 200 && resource.status < 300;
const httpLabel = (resource: FetchedResource) => (resource.status === null ? resource.error ?? "no response" : `HTTP ${resource.status}`);
const sameUrl = (left: string, right: string) => left.replace(/\/$/, "") === right.replace(/\/$/, "");
const looksLikeHtml = (resource: FetchedResource) =>
  (resource.contentType ?? "").includes("html") || /^\s*<(?:!doctype|html|head|body)/i.test(resource.body ?? "");

function deliveryCheck(file: FetchedResource, requested: string): VisibilityCheck {
  const base = { id: "delivery", title: "File at /llms.txt" };
  const type = file.contentType ?? "no content type";
  const evidence = [`${requested}: ${httpLabel(file)}${ok(file) ? `, ${type}` : ""}`];
  if (!sameUrl(file.url, requested)) evidence.push(`Redirects to ${file.url}`);
  if (!ok(file)) {
    return {
      ...base,
      status: "fail",
      summary: file.status === 404 || file.status === 410 ? "This site has no llms.txt file." : `/llms.txt did not load (${httpLabel(file)}).`,
      fix: "Generate a file, then upload it so it loads at /llms.txt as plain text.",
      link: { href: "/free-tools/llms-txt-generator", label: "Generate an llms.txt file" },
      evidence,
    };
  }
  if (looksLikeHtml(file)) {
    return {
      ...base,
      status: "fail",
      summary: new URL(file.url).pathname === "/"
        ? "This site has no llms.txt file: /llms.txt redirects to the homepage."
        : "/llms.txt returns an HTML page, not a text file. Many sites send their app or a not-found page for any unknown path with HTTP 200.",
      fix: "Add an llms.txt file at the site root, such as the public folder, so the server sends the file instead of the page.",
      link: { href: "/free-tools/llms-txt-generator", label: "Generate an llms.txt file" },
      evidence,
    };
  }
  const problems: string[] = [];
  if (!/text\/(?:plain|markdown|x-markdown)/i.test(type)) problems.push(`it is served as “${type}” instead of text/plain or text/markdown`);
  if (/[^\x00-\x7F]/.test(file.body ?? "") && !/charset=utf-8/i.test(type)) problems.push("it has non-English characters but no “charset=utf-8”, so some tools may show them garbled");
  const crossSite = new URL(file.url).hostname.replace(/^www\./, "") !== new URL(requested).hostname.replace(/^www\./, "");
  if (crossSite) problems.push("it redirects to another site");
  if (problems.length) {
    return {
      ...base,
      status: "warn",
      summary: `The file loads, but ${problems.join("; ")}.`,
      fix: "Serve the file directly at /llms.txt with “Content-Type: text/plain; charset=utf-8”.",
      evidence,
    };
  }
  return { ...base, status: "pass", summary: "The file loads as plain text.", evidence };
}

type LinkResult = { link: LlmsLink; resource: FetchedResource | null };

function linkStatusCheck(results: LinkResult[], total: number): VisibilityCheck {
  const base = { id: "link-status", title: "Links load" };
  const checked = results.filter((result) => result.resource);
  const broken: string[] = [];
  const unverified: string[] = [];
  const redirected: string[] = [];
  const insecure: string[] = [];
  for (const { link, resource } of results) {
    const label = `Line ${link.line}: ${link.url}`;
    if (/^http:\/\//i.test(link.url)) {
      insecure.push(`${label} uses http://`);
      continue;
    }
    if (!resource) continue;
    if (resource.status !== null && [401, 403, 429].includes(resource.status)) unverified.push(`${label}: HTTP ${resource.status}, the site blocked our request`);
    else if (resource.status === null) unverified.push(`${label}: ${resource.error ?? "no response"}`);
    else if (!ok(resource)) broken.push(`${label}: HTTP ${resource.status}`);
    else if (!sameUrl(resource.url, link.url)) redirected.push(`${label} redirects to ${resource.url}`);
  }
  const notChecked = total - checked.length - insecure.length;
  const scope = notChecked > 0 ? ` We checked the first ${checked.length} of ${total} links.` : "";
  if (!total) return { ...base, status: "info", summary: "No full URLs to check.", evidence: [] };
  if (broken.length) {
    return {
      ...base,
      status: "fail",
      summary: `${broken.length} link${broken.length === 1 ? " is" : "s are"} broken.${scope}`,
      fix: "Remove the broken links or point them to the pages' current URLs.",
      evidence: [...broken, ...redirected, ...unverified, ...insecure],
    };
  }
  if (redirected.length || unverified.length || insecure.length) {
    const parts = [
      redirected.length ? `${redirected.length} link${redirected.length === 1 ? " redirects" : "s redirect"}` : "",
      unverified.length ? `${unverified.length} could not be checked` : "",
      insecure.length ? `${insecure.length} use${insecure.length === 1 ? "s" : ""} http://` : "",
    ].filter(Boolean);
    return {
      ...base,
      status: "warn",
      summary: `No broken links, but ${parts.join(", ")}.${scope}`,
      fix: "List each page at its final https:// URL so tools do not have to follow redirects.",
      evidence: [...redirected, ...unverified, ...insecure],
    };
  }
  return { ...base, status: "pass", summary: `All ${checked.length} links we checked load without redirects.${scope}`, evidence: [] };
}

export async function checkLlmsTxt(website: URL, fetcher: typeof fetch = fetch, generatedAt = new Date()): Promise<LlmsCheckReport> {
  let used = 0;
  // Every hop of fetchResource goes through this, so the budget counts redirects.
  const counted: typeof fetch = (input, init) => {
    used += 1;
    return fetcher(input, init);
  };
  const fileUrl = `${website.origin}/llms.txt`;
  const file = await fetchResource(fileUrl, counted, {
    userAgent: browserUserAgent,
    accept: "text/plain,text/markdown;q=0.9,*/*;q=0.8",
    readBody: true,
    maxBytes: FILE_BYTES,
  });
  const delivery = deliveryCheck(file, fileUrl);
  const report = { website: `${website.origin}/`, fileUrl, generatedAt: generatedAt.toISOString() };
  if (!ok(file) || looksLikeHtml(file)) return { ...report, found: false, checks: [delivery], linksChecked: 0, linksTotal: 0 };

  const text = file.body ?? "";
  const format = validateLlmsTxt(text);
  const seen = new Set<string>();
  const links = parseLlmsTxt(text).links.filter((link) => {
    if (!/^https?:\/\//i.test(link.url) || seen.has(link.url)) return false;
    seen.add(link.url);
    return true;
  });
  const results = await pool(links.slice(0, LINK_LIMIT), CONCURRENCY, async (link): Promise<LinkResult> => {
    // Each link may redirect a few times; stop before the platform limit.
    if (/^http:\/\//i.test(link.url) || used + 3 > SUBREQUEST_BUDGET) return { link, resource: null };
    const resource = await fetchResource(link.url, counted, { userAgent: browserUserAgent, accept: "*/*", readBody: false, maxBytes: 0 });
    return { link, resource };
  });
  const linkStatus = linkStatusCheck(results, links.length);
  const formatChecks = format.filter((check) => check.id !== "optional" && check.id !== "size");
  const notes = format.filter((check) => check.id === "optional" || check.id === "size");
  return {
    ...report,
    found: true,
    checks: [delivery, ...formatChecks, linkStatus, ...notes],
    linksChecked: results.filter((result) => result.resource).length,
    linksTotal: links.length,
  };
}
