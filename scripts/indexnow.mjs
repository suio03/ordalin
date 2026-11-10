// IndexNow: tell Bing which pages changed in a deploy, so it recrawls them now instead of
// whenever it next finds them. Google doesn't use IndexNow. Only Bing is notified.
//
//   node scripts/indexnow.mjs before    before the deploy: fingerprints every live sitemap page
//                                       (the old version) into .indexnow-snapshot.json
//   node scripts/indexnow.mjs after     after the deploy: fingerprints the live pages again and
//                                       submits the new, changed and removed URLs to Bing
//   node scripts/indexnow.mjs submit <url>… | --all   send given URLs, or every sitemap URL
//
// Add --dry-run to `after` or `submit` to print without sending. `pnpm deploy:production`
// (the Workers Builds deploy command) runs before and after; IndexNow failures never fail a
// deploy.
//
// Ordalin pages are rendered on request, so there is no built HTML to compare with: the
// script compares the live site before and after the deploy instead. A page counts as changed
// when its title, meta tags, canonical links, JSON-LD, visible text or image sources differ.
// Scripts (RSC payload, build ids) are ignored. Sitemap URLs that are new or gone are sent too
// (gone ones should now 404 or redirect, which tells Bing to drop them).
//
// The key is public by design: IndexNow checks that https://ordalin.com/<key>.txt holds it.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";

const HOST = "ordalin.com";
const ORIGIN = `https://${HOST}`;
const KEY = "9955257e71a362a1019fdef3d65e4284";
const KEY_LOCATION = `${ORIGIN}/${KEY}.txt`;
const ENDPOINT = "https://www.bing.com/indexnow";
const SNAPSHOT = ".indexnow-snapshot.json";
// The WAF rate limit is 200 requests per 10 s per IP; 3 parallel fetches stay well under it.
const PARALLEL = 3;

const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** The parts of a page a search engine cares about, without scripts and build ids. */
function fingerprint(html) {
  const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? "";
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
  const title = head.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const metas = [...head.matchAll(/<meta\s+(?:name|property)="([^"]+)"\s+content="([^"]*)"/gi)]
    .filter((m) => !/^theme-color$/i.test(m[1]))
    .map((m) => `${m[1]}=${m[2]}`);
  const links = [...head.matchAll(/<link\s+rel="(canonical|alternate)"[^>]*>/gi)].map((m) => m[0]);
  const ldJson = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const images = [...body.matchAll(/<img\b[^>]*>/gi)].map((m) => {
    const src = m[0].match(/\ssrc="([^"]*)"/)?.[1] ?? "";
    const alt = m[0].match(/\salt="([^"]*)"/)?.[1] ?? "";
    return `${src}|${alt}`;
  });
  const text = body
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return createHash("sha256").update([title, ...metas, ...links, ...ldJson, ...images, text].join("\n")).digest("hex");
}

async function fetchText(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { redirect: "manual", headers: { "user-agent": "ordalin-indexnow" } }).catch(() => null);
    if (res?.ok) return res.text();
    if (res && res.status !== 429 && res.status < 500) return null;
    await sleep(2000 * (attempt + 1));
  }
  return null;
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/** Every sitemap URL with its fingerprint (null when the page did not load). */
async function snapshotLive() {
  const xml = await fetchText(`${ORIGIN}/sitemap.xml`);
  if (!xml) throw new Error("live sitemap unavailable");
  const urls = locs(xml);
  const prints = await mapLimit(urls, PARALLEL, async (url) => {
    const html = await fetchText(url);
    return html === null ? null : fingerprint(html);
  });
  return Object.fromEntries(urls.map((url, i) => [url, prints[i]]));
}

async function before() {
  const pages = await snapshotLive();
  await writeFile(SNAPSHOT, JSON.stringify({ at: new Date().toISOString(), pages }));
  const failed = Object.values(pages).filter((p) => p === null).length;
  console.log(`IndexNow: fingerprinted ${Object.keys(pages).length} live pages${failed ? ` (${failed} did not load)` : ""}`);
}

async function after(args) {
  if (!existsSync(SNAPSHOT)) throw new Error(`no ${SNAPSHOT}; run "before" ahead of the deploy`);
  const old = JSON.parse(await readFile(SNAPSHOT, "utf8")).pages;
  // Give the new version a moment to reach every edge before reading it.
  await sleep(15000);
  const now = await snapshotLive();
  const added = Object.keys(now).filter((u) => !(u in old));
  const removed = Object.keys(old).filter((u) => !(u in now));
  // A page that failed to load either time is left out rather than guessed at.
  const changed = Object.keys(now).filter((u) => u in old && old[u] && now[u] && old[u] !== now[u]);
  console.log(`IndexNow diff: ${added.length} new, ${changed.length} changed, ${removed.length} removed (of ${Object.keys(now).length} in the sitemap)`);
  await submit([...args.filter((a) => a === "--dry-run"), ...added, ...changed, ...removed], { allowEmpty: true });
}

async function submit(args, { allowEmpty = false } = {}) {
  const dryRun = args.includes("--dry-run");
  const rest = args.filter((a) => a !== "--dry-run");
  let urls;
  if (rest.includes("--all")) {
    const xml = await fetchText(`${ORIGIN}/sitemap.xml`);
    if (!xml) throw new Error("live sitemap unavailable");
    urls = locs(xml);
  } else if (rest.length || allowEmpty) urls = rest;
  else throw new Error("pass URLs or --all");

  urls = [...new Set(urls)].filter((u) => new URL(u).host === HOST);
  if (!urls.length) return console.log("IndexNow: nothing to submit");
  if (dryRun) return console.log(`IndexNow dry run: would submit ${urls.length}\n  ${urls.join("\n  ")}`);

  // Bing fetches the key file before trusting a submission.
  const key = await fetchText(KEY_LOCATION);
  if (key?.trim() !== KEY) throw new Error(`${KEY_LOCATION} does not serve the key`);

  // One request takes up to 10,000 URLs.
  for (let i = 0; i < urls.length; i += 10000) {
    const urlList = urls.slice(i, i + 10000);
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
    });
    // 200 OK and 202 Accepted (key not yet verified) both mean received.
    if (res.status !== 200 && res.status !== 202) throw new Error(`Bing IndexNow HTTP ${res.status}: ${await res.text()}`);
    console.log(`IndexNow: submitted ${urlList.length} URL(s) to Bing, HTTP ${res.status}`);
  }
  for (const u of urls) console.log(`  ${u}`);
}

const [cmd, ...args] = process.argv.slice(2);
const run = { before: () => before(), after: () => after(args), submit: () => submit(args) }[cmd];
if (!run) {
  console.error("usage: node scripts/indexnow.mjs before | after [--dry-run] | submit [--dry-run] [--all | <url>…]");
  process.exit(2);
}
run().catch((err) => {
  console.error(`IndexNow: ${err.message}`);
  process.exit(1);
});
