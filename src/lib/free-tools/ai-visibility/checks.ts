import { attr, meta, plainText } from "@/lib/catalog-enrichment/html";
import { crawlers, type CrawlerPurpose } from "./crawlers";
import { parseRobots, robotsVerdict, type RobotsVerdict } from "./robots";

export type FetchedResource = {
  status: number | null;
  url: string;
  body?: string;
  contentType?: string;
  robotsTag?: string;
  error?: string;
};

export type VisibilityInput = {
  website: string;
  page: FetchedResource;
  robots: FetchedResource;
  llms: FetchedResource;
  sitemap: FetchedResource | null;
  probes: Array<{ token: string; status: number | null; error?: string }>;
};

export type CheckStatus = "pass" | "warn" | "fail" | "info";

export type VisibilityCheck = {
  id: string;
  title: string;
  status: CheckStatus;
  summary: string;
  evidence: string[];
  fix?: string;
  snippet?: string;
  /** A related Ordalin tool that helps with this check. */
  link?: { href: string; label: string };
};

export type CrawlerAccess = {
  token: string;
  owner: string;
  purpose: CrawlerPurpose;
  use: string;
} & RobotsVerdict;

export type VisibilityReport = {
  website: string;
  domain: string;
  checkedAt: string;
  checks: VisibilityCheck[];
  crawlers: CrawlerAccess[];
  passed: number;
  scored: number;
};

// Checks that need the homepage are left out of the count when it could not be fetched.
const unreadable = { status: "info" as const, summary: "Not checked: we could not read your homepage HTML.", evidence: [] };

const ok = (status: number | null) => status !== null && status >= 200 && status < 300;
const httpLabel = (resource: { status: number | null; error?: string }) =>
  resource.status === null ? resource.error ?? "no response" : `HTTP ${resource.status}`;

function crawlerAccess(robots: FetchedResource): CrawlerAccess[] | null {
  // RFC 9309: an unreachable robots.txt (5xx) means "disallow everything";
  // any 4xx means there are no rules.
  if (robots.status === null) return null;
  const parsed = ok(robots.status) ? parseRobots(robots.body ?? "") : parseRobots("");
  const unreachable = robots.status >= 500;
  return crawlers.map((crawler) => ({
    ...crawler,
    ...(unreachable
      ? { allowed: false, group: "none" as const, rule: `robots.txt returned HTTP ${robots.status}` }
      : robotsVerdict(parsed, crawler.token)),
  }));
}

function allowSnippet(tokens: string[]) {
  return [...tokens.map((token) => `User-agent: ${token}`), "Allow: /"].join("\n");
}

function answerCrawlerCheck(robots: FetchedResource, access: CrawlerAccess[] | null): VisibilityCheck {
  const base = { id: "answer-crawlers", title: "AI search crawlers can reach your homepage" };
  if (!access) {
    return { ...base, status: "warn", summary: `We could not fetch robots.txt (${httpLabel(robots)}), so crawler access is unknown.`, evidence: [robots.url] };
  }
  const blocked = (purpose: CrawlerPurpose) => access.filter((item) => item.purpose === purpose && !item.allowed);
  const answers = blocked("answers");
  const users = blocked("user");
  const mixed = blocked("mixed");
  const evidence = [...answers, ...users, ...mixed].map((item) => `${item.token} (${item.use}): blocked by “${item.rule}”`);
  if (robots.status !== null && robots.status >= 500) {
    return {
      ...base,
      status: "fail",
      summary: `robots.txt returned HTTP ${robots.status}. Crawlers that follow the robots.txt standard treat an unreachable file as “block the whole site”.`,
      evidence: [robots.url],
      fix: "Serve robots.txt with HTTP 200, or let it return 404 if you have no rules.",
    };
  }
  if (answers.length) {
    return {
      ...base,
      status: "fail",
      summary: `${answers.length} AI search ${answers.length === 1 ? "crawler is" : "crawlers are"} blocked, so those answer engines cannot read or cite your homepage.`,
      evidence,
      fix: "Add a group that allows the blocked search crawlers. Keep any training-crawler rules you want.",
      snippet: allowSnippet(answers.map((item) => item.token)),
    };
  }
  if (users.length || mixed.length) {
    return {
      ...base,
      status: "warn",
      summary: "AI search crawlers are allowed, but some user-triggered or Gemini crawlers are blocked.",
      evidence,
      fix: "ChatGPT-User and Perplexity-User may ignore robots.txt, so these blocks are unreliable either way. Blocking Google-Extended also keeps your pages out of Gemini Apps grounding.",
    };
  }
  return {
    ...base,
    status: "pass",
    summary: ok(robots.status)
      ? "robots.txt lets every AI search crawler we check reach your homepage."
      : `There is no robots.txt (${httpLabel(robots)}), so every crawler is allowed.`,
    evidence: [robots.url],
  };
}

function trainingCrawlerCheck(access: CrawlerAccess[] | null): VisibilityCheck {
  const training = (access ?? []).filter((item) => item.purpose === "training");
  const blocked = training.filter((item) => !item.allowed);
  return {
    id: "training-crawlers",
    title: "Training crawlers",
    status: "info",
    summary: !access
      ? "Unknown, because robots.txt could not be fetched."
      : blocked.length
        ? `You block ${blocked.length} of ${training.length} training crawlers. That is a policy choice and does not remove you from AI search results.`
        : "All training crawlers we check are allowed. Blocking them is a policy choice and would not remove you from AI search results.",
    evidence: blocked.map((item) => `${item.token} (${item.owner}): blocked by “${item.rule}”`),
  };
}

const BLOCKING_STATUSES = new Set([401, 403, 406, 429, 503]);

function botResponseCheck(input: VisibilityInput): VisibilityCheck {
  const base = { id: "bot-response", title: "Your server answers AI crawlers" };
  if (!ok(input.page.status)) {
    return { ...base, status: "info", summary: `Not checked: your homepage returned ${httpLabel(input.page)} to our browser request, so there is nothing to compare crawler responses with.`, evidence: [input.page.url] };
  }
  const refused = input.probes.filter((probe) => probe.status === null || BLOCKING_STATUSES.has(probe.status));
  const evidence = input.probes.map((probe) => `${probe.token}: ${httpLabel(probe)}`);
  if (refused.length) {
    return {
      ...base,
      status: "fail",
      summary: `A normal browser gets HTTP ${input.page.status}, but ${refused.map((probe) => probe.token).join(", ")} ${refused.length === 1 ? "was" : "were"} refused. A firewall or CDN bot rule is likely blocking AI crawlers even where robots.txt allows them.`,
      evidence: [`Browser: HTTP ${input.page.status}`, ...evidence],
      fix: "Check bot-blocking settings in your CDN or firewall (for example Cloudflare's AI bot blocking) and allow the AI search crawlers you want to be cited by.",
    };
  }
  return { ...base, status: "pass", summary: "AI crawler user agents get the same response as a normal browser.", evidence: [`Browser: HTTP ${input.page.status}`, ...evidence] };
}

function robotsDirectives(html: string, header: string | undefined) {
  const values: string[] = [];
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const name = attr(match[0], "name").toLowerCase();
    if (name === "robots" || name === "googlebot") values.push(`<meta name="${name}"> ${attr(match[0], "content").toLowerCase()}`);
  }
  // X-Robots-Tag may target one crawler ("googlebot: noindex"); include every value.
  if (header) values.push(`X-Robots-Tag: ${header.toLowerCase()}`);
  return values;
}

function indexingCheck(input: VisibilityInput, html: string | null): VisibilityCheck {
  const base = { id: "indexing", title: "Your homepage may be indexed and quoted" };
  if (html === null) return { ...base, ...unreadable };
  const directives = robotsDirectives(html, input.page.robotsTag);
  const blocking = directives.filter((value) => /\b(noindex|none)\b/.test(value));
  const limiting = directives.filter((value) => /\bnosnippet\b|max-snippet\s*:\s*0\b/.test(value));
  if (blocking.length) {
    return { ...base, status: "fail", summary: "Your homepage tells crawlers not to index it, so search-based AI answers cannot use it.", evidence: blocking, fix: "Remove noindex from the homepage's robots meta tag or X-Robots-Tag header." };
  }
  if (limiting.length) {
    return { ...base, status: "warn", summary: "Indexing is allowed, but snippets are blocked, which keeps your text out of Google's AI Overviews and AI Mode.", evidence: limiting, fix: "Remove nosnippet or max-snippet:0 unless you mean to keep your text out of AI answers." };
  }
  return { ...base, status: "pass", summary: "No noindex or nosnippet directives on the homepage.", evidence: directives };
}

function visibleWords(html: string) {
  const body = /<body\b[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? html;
  const text = plainText(body);
  return text ? text.split(" ").length : 0;
}

function contentCheck(html: string | null): VisibilityCheck {
  const base = { id: "raw-html", title: "Content is readable without JavaScript" };
  if (html === null) return { ...base, ...unreadable };
  const words = visibleWords(html);
  const evidence = [`${words} words of text in the HTML before any JavaScript runs`];
  const fix = "Render the main copy on the server (server-side rendering or static generation) so crawlers that do not run JavaScript can read it.";
  if (words < 50) return { ...base, status: "fail", summary: "The homepage HTML is almost empty until JavaScript runs. Many AI crawlers do not run JavaScript, so they see a blank page.", evidence, fix };
  if (words < 150) return { ...base, status: "warn", summary: "Only a little text is in the HTML before JavaScript runs. Crawlers that skip JavaScript may miss what your product does.", evidence, fix };
  return { ...base, status: "pass", summary: "Your main content is in the HTML, so crawlers that skip JavaScript can read it.", evidence };
}

function basicsCheck(input: VisibilityInput, html: string | null): VisibilityCheck {
  const base = { id: "page-basics", title: "Title, description, H1 and canonical" };
  if (html === null) return { ...base, ...unreadable };
  const title = plainText(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "");
  const description = meta(html, "description");
  const h1 = plainText(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] ?? "");
  let canonical: string | null = null;
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    if (attr(match[0], "rel").toLowerCase().split(/\s+/).includes("canonical")) canonical = attr(match[0], "href") || null;
  }
  let foreignCanonical = false;
  if (canonical) {
    try {
      const host = (value: string) => new URL(value, input.page.url).hostname.replace(/^www\./, "");
      foreignCanonical = host(canonical) !== host(input.page.url);
    } catch {
      foreignCanonical = true;
    }
  }
  const evidence = [
    title ? `Title: “${title}”` : "Title: missing",
    description ? `Meta description: “${description}”` : "Meta description: missing",
    h1 ? `H1: “${h1}”` : "H1: missing",
    canonical ? `Canonical: ${canonical}` : "Canonical: missing",
  ];
  const problems = [!description && "meta description", !h1 && "H1", !canonical && "canonical link"].filter(Boolean);
  if (!title) return { ...base, status: "fail", summary: "The homepage has no title, the first thing search and AI answers use to name your page.", evidence, fix: "Add a <title> that says what the product is." };
  if (foreignCanonical) return { ...base, status: "warn", summary: "The canonical link points to a different domain, so crawlers may credit that domain instead of this one.", evidence, fix: "Point the canonical link at this page's own URL." };
  if (problems.length) return { ...base, status: "warn", summary: `Missing: ${problems.join(", ")}. AI answers lean on these to describe your product.`, evidence, fix: "Add a one-sentence meta description of what the product does, one H1, and a self-referencing canonical link." };
  return { ...base, status: "pass", summary: "Title, meta description, H1 and canonical link are all present.", evidence };
}

const ENTITY_TYPES = new Set(["organization", "corporation", "website", "softwareapplication", "webapplication", "mobileapplication", "product", "localbusiness"]);

function jsonLdTypes(html: string) {
  const types: string[] = [];
  let invalid = 0;
  const visit = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== "object") return;
    const record = value as Record<string, unknown>;
    for (const type of [record["@type"]].flat()) if (typeof type === "string") types.push(type);
    if (record["@graph"]) visit(record["@graph"]);
  };
  for (const match of html.matchAll(/<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      visit(JSON.parse(match[1]));
    } catch {
      invalid += 1;
    }
  }
  return { types: [...new Set(types)], invalid };
}

function structuredDataCheck(input: VisibilityInput, html: string | null): VisibilityCheck {
  const base = { id: "structured-data", title: "Structured data names your product" };
  if (html === null) return { ...base, ...unreadable };
  const { types, invalid } = jsonLdTypes(html);
  const origin = new URL(input.page.url).origin;
  const snippet = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Your product",
    url: `${origin}/`,
    applicationCategory: "BusinessApplication",
    description: "One sentence on what the product does.",
    publisher: { "@type": "Organization", name: "Your company", url: `${origin}/`, sameAs: ["https://www.linkedin.com/company/your-company"] },
  }, null, 2);
  const evidence = [
    types.length ? `JSON-LD types: ${types.join(", ")}` : "No JSON-LD found",
    ...(invalid ? [`${invalid} JSON-LD block${invalid === 1 ? "" : "s"} could not be parsed`] : []),
  ];
  const fix = "Add a JSON-LD block that names the product and the company behind it, with links to your official profiles in sameAs.";
  if (types.some((type) => ENTITY_TYPES.has(type.toLowerCase())) && !invalid) {
    return { ...base, status: "pass", summary: "JSON-LD tells crawlers which product and organization this site belongs to.", evidence };
  }
  if (invalid) return { ...base, status: "warn", summary: "Some JSON-LD on the homepage is invalid JSON, so crawlers ignore it.", evidence, fix: "Fix the JSON syntax, then test the page in Google's Rich Results Test.", snippet };
  return { ...base, status: "warn", summary: "No structured data identifies your product or organization, so crawlers must guess what the site is.", evidence, fix, snippet: `<script type="application/ld+json">\n${snippet}\n</script>` };
}

function llmsCheck(llms: FetchedResource): VisibilityCheck {
  const base = { id: "llms-txt", title: "llms.txt (optional)", link: { href: "/free-tools/llms-txt-generator", label: "Generate an llms.txt file" } };
  const body = llms.body?.trim() ?? "";
  const isText = ok(llms.status) && !/^<(?:!doctype|html)/i.test(body) && !(llms.contentType ?? "").includes("html");
  if (!isText) {
    return { ...base, status: "info", summary: "No llms.txt. It is an optional proposal, and no AI company has said it uses the file to choose citations.", evidence: [`${llms.url}: ${ok(llms.status) ? "returns an HTML page" : httpLabel(llms)}`] };
  }
  const firstLine = body.split(/\r?\n/).find((line) => line.trim()) ?? "";
  const check = { href: "/free-tools/llms-txt-checker", label: "Check the full llms.txt format" };
  if (!firstLine.startsWith("# ")) {
    return { ...base, link: check, status: "info", summary: "llms.txt exists but does not start with an H1 (“# Name”), which the proposal requires.", evidence: [`First line: “${firstLine.slice(0, 120)}”`] };
  }
  return { ...base, link: check, status: "info", summary: "llms.txt exists and starts with an H1 as the proposal requires.", evidence: [`First line: “${firstLine.slice(0, 120)}”`] };
}

function sitemapCheck(robots: FetchedResource, sitemap: FetchedResource | null): VisibilityCheck {
  const base = { id: "sitemap", title: "Sitemap is reachable" };
  const declared = ok(robots.status) ? parseRobots(robots.body ?? "").sitemaps : [];
  if (sitemap && ok(sitemap.status)) {
    return { ...base, status: "pass", summary: declared.length ? "robots.txt declares a sitemap and it loads." : "A sitemap loads at /sitemap.xml.", evidence: [`${sitemap.url}: HTTP ${sitemap.status}`] };
  }
  return {
    ...base,
    status: "warn",
    summary: "We found no working sitemap, so crawlers rely on links alone to discover your pages.",
    evidence: sitemap ? [`${sitemap.url}: ${httpLabel(sitemap)}`] : ["No Sitemap line in robots.txt"],
    fix: "Publish a sitemap.xml and add a “Sitemap:” line to robots.txt.",
  };
}

export function sitemapUrl(robots: FetchedResource, origin: string) {
  const declared = ok(robots.status) ? parseRobots(robots.body ?? "").sitemaps : [];
  for (const value of declared) {
    try {
      return new URL(value, origin).href;
    } catch {
      // Ignore malformed lines and fall back to the conventional path.
    }
  }
  return `${origin}/sitemap.xml`;
}

export function buildVisibilityReport(input: VisibilityInput, checkedAt = new Date()): VisibilityReport {
  const access = crawlerAccess(input.robots);
  const html = ok(input.page.status) && input.page.body ? input.page.body : null;
  const checks = [
    answerCrawlerCheck(input.robots, access),
    botResponseCheck(input),
    indexingCheck(input, html),
    contentCheck(html),
    basicsCheck(input, html),
    structuredDataCheck(input, html),
    sitemapCheck(input.robots, input.sitemap),
    trainingCrawlerCheck(access),
    llmsCheck(input.llms),
  ];
  const scored = checks.filter((check) => check.status !== "info");
  return {
    website: input.website,
    domain: new URL(input.website).hostname.replace(/^www\./, ""),
    checkedAt: checkedAt.toISOString(),
    checks,
    crawlers: access ?? [],
    passed: scored.filter((check) => check.status === "pass").length,
    scored: scored.length,
  };
}
