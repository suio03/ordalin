import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EnrichmentEvidencePage } from "../src/lib/catalog-enrichment/contract.ts";
import type { CatalogImportBundle } from "../src/lib/catalog-import/contract.ts";
import { assertPublicHttpsUrl } from "../src/lib/catalog-enrichment/url-policy.ts";

// Resolves one crawl warning after the operator opened that URL in the
// ai-publisher Chrome profile: either add the official page as evidence, or
// record why the link holds no official content (--unavailable="reason", e.g.
// a sign-in wall or a third-party host). robots.txt refusals never qualify.
const argument = (name: string) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split("=", 2)[1];
const bundlePath = argument("bundle");
const capturePath = argument("capture");
const unavailable = argument("unavailable")?.trim();
if (!bundlePath || !capturePath) throw new Error("Usage: --bundle=<bundle.json> --capture=<capture.json> [--unavailable=<reason>]");

type Capture = {
  requestedUrl: string;
  url: string;
  role: EnrichmentEvidencePage["role"];
  title: string | null;
  description: string | null;
  headings: string[];
  text: string;
};

const roles = new Set<EnrichmentEvidencePage["role"]>(["homepage", "pricing", "features", "docs", "security", "privacy"]);
const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
const bundle = JSON.parse(await readFile(path.resolve(bundlePath), "utf8")) as CatalogImportBundle;
const capture = JSON.parse(await readFile(path.resolve(capturePath), "utf8")) as Capture;
const official = bundle.candidate.canonicalDomain;
const url = assertPublicHttpsUrl(capture.url);
if (!roles.has(capture.role)) throw new Error(`Unknown evidence role ${capture.role}.`);
const warning = bundle.candidate.warnings.find((item) => item.startsWith(`${capture.role}: ${capture.requestedUrl}: `));
if (!warning) throw new Error(`No ${capture.role} crawl warning for ${capture.requestedUrl} in this bundle.`);
const resolve = (reason: string | null) => {
  bundle.candidate.warnings = bundle.candidate.warnings.filter((item) => item !== warning);
  bundle.browserEvidence = [...(bundle.browserEvidence ?? []), { requestedUrl: capture.requestedUrl, url: url.href, resolvedWarning: warning, unavailableReason: reason, capturedAt: new Date().toISOString() }];
  return writeFile(path.resolve(bundlePath), `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
};

if (unavailable) {
  if (unavailable.length < 12) throw new Error("Describe what the browser showed in --unavailable.");
  await resolve(unavailable);
  console.log(`Resolved "${warning}" without evidence: ${unavailable} (${url.href}).`);
  process.exit(0);
}

const host = url.hostname.toLowerCase().replace(/^www\./, "");
if (host !== official && !host.endsWith(`.${official}`)) throw new Error(`${url.hostname} is not part of ${official}.`);
const excerpt = normalize(capture.text).slice(0, 16_000);
if (excerpt.length < 200) throw new Error("The captured page has too little text to serve as evidence.");

const page: EnrichmentEvidencePage = {
  url: url.href,
  role: capture.role,
  title: capture.title ? normalize(capture.title) : null,
  description: capture.description ? normalize(capture.description) : null,
  headings: capture.headings.map(normalize).filter(Boolean).slice(0, 40),
  excerpt,
};
bundle.candidate.evidencePages = [...bundle.candidate.evidencePages.filter((item) => item.url !== page.url), page];
bundle.candidate.officialLinks.push({ role: page.role, value: page.url, sourceUrl: page.url });
await resolve(null);
console.log(`Added ${page.url} (${excerpt.length} characters); resolved "${warning}".`);
