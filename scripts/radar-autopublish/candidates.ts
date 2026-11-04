// Fetches what keyword-radar pushed since the last auto-publish run and notes what Ordalin
// already has for each name. Used by run.sh; see docs/radar-autopublish.md.
//
//   node … candidates.ts --out=<run dir>     write <run dir>/candidates.json, print the count
//   node … candidates.ts --commit=<run dir>  after a finished run: next run starts where this one ended
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { d1Query } from "../lib/wrangler.ts";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const stateFile = path.join(projectRoot, ".ordalin-imports/radar-auto/state.json");
const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=", 2)[1];
// First run, or a long gap (Mac off): look back at most this far.
const MAX_LOOKBACK_MS = 3 * 86_400_000;

type State = { since?: string };
const readState = (): State => (existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, "utf8")) : {});

const commitDir = arg("commit");
if (commitDir) {
  const { until } = JSON.parse(readFileSync(path.join(commitDir, "candidates.json"), "utf8")) as { until: string };
  mkdirSync(path.dirname(stateFile), { recursive: true });
  writeFileSync(stateFile, `${JSON.stringify({ since: until }, null, 2)}\n`);
  console.log(`next run starts at ${until}`);
  process.exit(0);
}

const outDir = arg("out");
if (!outDir) throw new Error("Pass --out=<run dir> or --commit=<run dir>.");
const { RADAR_URL, RADAR_TOKEN } = process.env;
if (!RADAR_URL || !RADAR_TOKEN) throw new Error("RADAR_URL and RADAR_TOKEN must be set (see .env.radar).");

const floor = Date.now() - MAX_LOOKBACK_MS;
const since = new Date(Math.max(floor, Date.parse(readState().since ?? "") || floor)).toISOString();
const res = await fetch(`${RADAR_URL}/ordalin/candidates?since=${encodeURIComponent(since)}`, {
  headers: { Authorization: `Bearer ${RADAR_TOKEN}` },
});
if (!res.ok) throw new Error(`keyword-radar: HTTP ${res.status} ${await res.text()}`);
const feed = (await res.json()) as { since: string; until: string; items: Array<{ name: string; query: string }> };

const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const tools = await d1Query<{ slug: string; name: string; status: string }>(projectRoot, "--remote", "SELECT slug, name, status FROM tools");
const guideSlugs = [...readFileSync(path.join(projectRoot, "src/lib/guides.ts"), "utf8").matchAll(/^\s*"([a-z0-9-]+)": \(\) => import/gm)].map((m) => m[1]);

// Same name, or the name followed by more words ("clean your tv github" → Clean Your TV).
const covers = (name: string, query: string) => {
  const n = words(name);
  const q = words(query);
  return n.length >= 3 && (q === n || q.startsWith(`${n} `));
};
const items = feed.items.map((item) => ({
  ...item,
  ordalin: {
    tools: tools.filter((t) => covers(t.name, item.query) || covers(t.slug, item.query)).map((t) => `${t.slug} (${t.status})`),
    guides: guideSlugs.filter((g) => covers(g, item.query)),
  },
}));

mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "candidates.json"), `${JSON.stringify({ since: feed.since, until: feed.until, items }, null, 2)}\n`);
console.log(items.length);
