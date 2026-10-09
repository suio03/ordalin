// News radar: new AI personal agents and new models since the last run.
//
//   pnpm radar [--days=N] [--all] [--model=sonnet]
//
// New models come from OpenRouter's public model list (no key; each model has a `created` date) plus
// lab and tech-news feeds. New agents come from Google News searches, lab feeds, tech news and Hacker
// News. A local `claude -p` call (your Claude subscription, no API key) sorts the launch headlines.
// Nothing is published: the report lands in .ordalin-imports/radar/<date>.md for the maintainer.
// Other new products come from the Product Hunt imports (`pnpm imports:discover`), not from here.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { baseModelId, looksLikeLaunch, matchesKnown, nameKey, parseFeed, type NewsItem } from "./lib/radar.ts";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(projectRoot, ".ordalin-imports", "radar");
const statePath = path.join(outDir, "state.json");
const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=", 2)[1];
const showAll = process.argv.includes("--all");
const model = arg("model") ?? "sonnet";
const BATCH = 60;
const DAY = 86_400_000;

type State = { lastRun?: string; openRouterIds: string[]; reported: Record<string, string> };
const state: State = existsSync(statePath)
  ? JSON.parse(readFileSync(statePath, "utf8"))
  : { openRouterIds: [], reported: {} };

const now = new Date();
const days = arg("days") ? Number(arg("days")) : undefined;
// Default window: since the last run (at most 7 days back), or 2 days on the first run.
const since = new Date(
  days ? now.getTime() - days * DAY : Math.max(now.getTime() - 7 * DAY, state.lastRun ? Date.parse(state.lastRun) : now.getTime() - 2 * DAY),
);
const windowDays = Math.max(1, Math.ceil((now.getTime() - since.getTime()) / DAY));

const agentsJson = JSON.parse(readFileSync(path.join(projectRoot, "src/content/agents/agents.json"), "utf8")) as {
  agents: { slug: string; name: string; display_name?: string; channel: string }[];
};
const knownSlugs = new Set(agentsJson.agents.map((a) => a.slug));
const knownAgents = agentsJson.agents.flatMap((a) => [a.name, a.display_name ?? "", a.slug.replace(/-/g, " ")]).filter(Boolean);

// ---- sources ----

const googleNews = (query: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:${windowDays}d`)}&hl=en-US&gl=US&ceid=US:en`;
const FEEDS: Record<string, string> = {
  "Google News: agent launches": googleNews(`("AI agent" OR "personal agent" OR "AI assistant") (launches OR unveils OR introduces OR debuts OR releases)`),
  "Google News: agents from big tech": googleNews(`agent (OpenAI OR Meta OR Google OR xAI OR Microsoft OR Apple OR Amazon OR Anthropic OR Perplexity) launch`),
  "Google News: model releases": googleNews(`("new model" OR "AI model" OR "open-weight" OR LLM) (releases OR launches OR unveils OR introduces)`),
  "Google News: lab models": googleNews(`(OpenAI OR Anthropic OR DeepMind OR xAI OR Mistral OR DeepSeek OR Qwen OR Moonshot OR Zhipu OR MiniMax) model release`),
  "OpenAI news": "https://openai.com/news/rss.xml",
  "Google AI blog": "https://blog.google/technology/ai/rss/",
  "Meta newsroom": "https://about.fb.com/news/feed/",
  "Hugging Face blog": "https://huggingface.co/blog/feed.xml",
  "TechCrunch AI": "https://techcrunch.com/category/artificial-intelligence/feed/",
  "The Verge AI": "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
  "Reddit r/singularity": "https://www.reddit.com/r/singularity/new/.rss?limit=100",
};
const failures: string[] = [];

async function get(url: string): Promise<Response | undefined> {
  try {
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; OrdalinRadar/0.1; +https://ordalin.com)" }, signal: AbortSignal.timeout(20_000) });
    return res.ok ? res : (failures.push(`${url.slice(0, 60)}… HTTP ${res.status}`), undefined);
  } catch (error) {
    failures.push(`${url.slice(0, 60)}… ${(error as Error).message}`);
    return undefined;
  }
}

async function hackerNews(query: string): Promise<NewsItem[]> {
  const filters = `points>=15,created_at_i>${Math.floor(since.getTime() / 1000)}`;
  const res = await get(`https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=story&numericFilters=${encodeURIComponent(filters)}&hitsPerPage=100`);
  const data = (await res?.json()) as { hits: { objectID: string; title: string; url?: string; created_at: string; points: number }[] } | undefined;
  return (data?.hits ?? []).map((h) => ({
    id: "",
    source: `Hacker News (${h.points} points)`,
    title: h.title,
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    publishedAt: h.created_at,
  }));
}

type OpenRouterModel = { id: string; name: string; created: number; description?: string };
async function openRouterModels(): Promise<OpenRouterModel[]> {
  const res = await get("https://openrouter.ai/api/v1/models");
  return ((await res?.json()) as { data: OpenRouterModel[] } | undefined)?.data ?? [];
}

const [feedResults, hnAgents, hnModels, routerModels] = await Promise.all([
  Promise.all(Object.entries(FEEDS).map(async ([source, url]) => parseFeed((await (await get(url))?.text()) ?? "", source))),
  hackerNews("agent"),
  hackerNews("model"),
  openRouterModels(),
]);

// ---- new models on OpenRouter ----

const seenIds = new Set(state.openRouterIds);
const newRouterModels = new Map<string, OpenRouterModel>();
for (const m of routerModels.sort((a, b) => b.created - a.created)) {
  const id = baseModelId(m.id);
  const fresh = m.created * 1000 >= since.getTime() && (showAll || !seenIds.has(m.id));
  if (fresh && !newRouterModels.has(id)) newRouterModels.set(id, { ...m, id, name: m.name.replace(/\s*\((batch|free|beta)\)$/i, "") });
}

// ---- news headlines → model ----

const seenUrls = new Set<string>();
const seenTitles = new Set<string>();
const headlines = [...feedResults.flat(), ...hnAgents, ...hnModels]
  .filter((item) => Date.parse(item.publishedAt) >= since.getTime() && looksLikeLaunch(item.title))
  .filter((item) => {
    const titleKey = nameKey(item.title.replace(/ - [^-]+$/, ""));
    if (seenUrls.has(item.url) || seenTitles.has(titleKey)) return false;
    seenUrls.add(item.url);
    seenTitles.add(titleKey);
    return true;
  })
  .map((item, i) => ({ ...item, id: `n${i + 1}` }));

const SYSTEM = `You sort AI news headlines for Ordalin, a directory of AI tools. Find two kinds of launches:

1. "agent": a newly launched or announced general-purpose AI agent that does tasks for a person: a personal or work assistant agent that acts across apps, email, calendar, browsing, computer use or purchases (examples: Meta Muse, ChatGPT Dots, Grok Bot, Gemini Spark, OpenClaw, Hark Pro). Include consumer and work agents from any company, including open-source ones. Exclude coding-only agents, agents for a single industry or job (finance research, legal, sales, customer support, SRE), agent frameworks and SDKs, benchmarks, agent infrastructure, and features that merely add "agentic" steps to an existing app.
2. "model": a newly released or announced general-purpose AI model with its own name or version (language, reasoning, image, video, audio, speech, music, embedding or multimodal), including open-weight releases. Exclude models for one narrow domain (genomics, weather, agriculture, geospatial, a single industry), price changes, papers without a released model, and benchmark or opinion pieces.

Rules:
- Only report what the headlines say. Never add facts from memory; if the vendor is not clear from the headline, use "unknown".
- One entry per product: group every headline about the same product and list all their ids.
- Agents Ordalin already covers are listed below as "slug: names". If an agent headline is about one of them (a new version, platform or rollout counts as the same agent), set "known" to that slug; otherwise set "known" to null. Use the product's own name, not a description, as "name" when the headlines give one.
- Skip headlines that discuss an existing product without a new launch, version or availability change.
- "status" is "launched" (available now), "preview" (limited, beta, waitlist or research preview) or "announced" (not yet available).
- "summary" is one plain English sentence on what it is, from the headlines.

Respond with one JSON object and nothing else: {"items":[{"kind":"agent"|"model","name":"...","vendor":"...","status":"...","summary":"...","known":"slug"|null,"ids":["n1"]}]}

Agents already covered:
${agentsJson.agents.map((a) => `${a.slug}: ${[a.name, a.display_name].filter(Boolean).join(", ")}`).join("\n")}`;

type Finding = { kind: "agent" | "model"; name: string; vendor: string; status: string; summary: string; known?: string | null; ids: string[] };

function runClaude(system: string, user: string): Promise<string> {
  const cwd = mkdtempSync(path.join(tmpdir(), "ordalin-radar-")); // empty dir: no project instructions or files
  const args = ["-p", "--model", model, "--tools", "", "--strict-mcp-config", "--setting-sources", "", "--no-session-persistence", "--output-format", "json", "--system-prompt", system];
  return new Promise((resolve, reject) => {
    const child = spawn("claude", args, { cwd, stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", reject);
    child.on("close", (code) => {
      rmSync(cwd, { recursive: true, force: true });
      if (code !== 0) return reject(new Error(`claude exited ${code}: ${err.slice(0, 300)}`));
      try {
        resolve(String(JSON.parse(out).result ?? ""));
      } catch {
        reject(new Error(`claude returned non-JSON output: ${out.slice(0, 300)}`));
      }
    });
    child.stdin.end(user);
  });
}

const findings: Finding[] = [];
for (let i = 0; i < headlines.length; i += BATCH) {
  const batch = headlines.slice(i, i + BATCH);
  const user = batch.map((h) => `${h.id} | ${h.publishedAt.slice(0, 10)} | ${h.source} | ${h.title}`).join("\n");
  process.stderr.write(`Sorting headlines ${i + 1}–${i + batch.length} of ${headlines.length} with claude ${model}…\n`);
  const text = await runClaude(SYSTEM, user);
  const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as { items?: Finding[] };
  const valid = new Set(batch.map((h) => h.id));
  for (const f of parsed.items ?? []) {
    const ids = (f.ids ?? []).filter((id) => valid.has(id));
    if ((f.kind === "agent" || f.kind === "model") && f.name && ids.length) findings.push({ ...f, ids });
  }
}

// Merge the same product across batches.
const merged = new Map<string, Finding>();
for (const f of findings) {
  const key = f.known ? `${f.kind}:${f.known}` : `${f.kind}:${nameKey(f.name)}`;
  const existing = merged.get(key);
  if (existing) existing.ids = [...new Set([...existing.ids, ...f.ids])];
  else merged.set(key, { ...f });
}
const byId = new Map(headlines.map((h) => [h.id, h]));
const reportedBefore = (f: Finding) => !showAll && `${f.kind}:${nameKey(f.name)}` in state.reported;

const allFindings = [...merged.values()];
const agents = allFindings.filter((f) => f.kind === "agent");
const isKnownAgent = (f: Finding) => Boolean(f.known && knownSlugs.has(f.known)) || matchesKnown(f.name, knownAgents);
const newAgents = agents.filter((f) => !isKnownAgent(f) && !reportedBefore(f));
const knownAgentNews = agents.filter(isKnownAgent);
const routerNames = [...newRouterModels.values()].flatMap((m) => [m.name, m.name.replace(/^[^:]+:\s*/, ""), m.id.split("/")[1]]);
const newsModels = allFindings.filter((f) => f.kind === "model" && !reportedBefore(f));
const newsOnlyModels = newsModels.filter((f) => !matchesKnown(f.name, routerNames));
const alsoInNews = newsModels.filter((f) => matchesKnown(f.name, routerNames));

// ---- report ----

const date = now.toISOString().slice(0, 10);
const sourcesOf = (f: Finding) =>
  f.ids
    .map((id) => byId.get(id))
    .filter((h): h is (typeof headlines)[number] => Boolean(h))
    .slice(0, 2)
    .map((h) => `[${h.title.length > 90 ? `${h.title.slice(0, 87)}…` : h.title}](${h.url}) (${h.source}, ${h.publishedAt.slice(0, 10)})`);
const findingLines = (list: Finding[]) =>
  list.flatMap((f) => [`- **${f.name}** · ${f.vendor} · ${f.status} — ${f.summary}`, ...sourcesOf(f).map((s) => `  - ${s}`)]);

const md = [
  `# Radar ${date}`,
  "",
  `Window: since ${since.toISOString().slice(0, 16).replace("T", " ")} UTC (${windowDays} day${windowDays > 1 ? "s" : ""}). ` +
    `${headlines.length} launch headlines sorted by claude ${model}; ${newRouterModels.size} new OpenRouter models.` +
    (showAll ? " --all: earlier reports not hidden." : ""),
  "",
  "Headlines are leads, not facts. Check the official page before anything goes on Ordalin.",
  "",
  `## New AI agents (${newAgents.length})`,
  "",
  ...(newAgents.length ? findingLines(newAgents) : ["None found."]),
  "",
  `## New models on OpenRouter (${newRouterModels.size})`,
  "",
  ...(newRouterModels.size
    ? [...newRouterModels.values()].map((m) => `- **${m.name}** · \`${m.id}\` · listed ${new Date(m.created * 1000).toISOString().slice(0, 10)}`)
    : ["None."]),
  ...(alsoInNews.length ? ["", "In the news as well:", ...findingLines(alsoInNews)] : []),
  "",
  `## Models in the news, not on OpenRouter (${newsOnlyModels.length})`,
  "",
  "App-only models, announcements, and open-weight releases OpenRouter has not listed yet.",
  "",
  ...(newsOnlyModels.length ? findingLines(newsOnlyModels) : ["None found."]),
  ...(knownAgentNews.length ? ["", "## News about agents already on /agents", "", ...findingLines(knownAgentNews)] : []),
  ...(failures.length ? ["", "## Sources that failed", "", ...failures.map((f) => `- ${f}`)] : []),
  "",
].join("\n");

mkdirSync(outDir, { recursive: true });
const reportPath = path.join(outDir, `${date}.md`);
writeFileSync(reportPath, md);
writeFileSync(path.join(outDir, `${date}.json`), `${JSON.stringify({ since, headlines, findings: allFindings, openRouter: [...newRouterModels.values()], failures }, null, 2)}\n`);

for (const f of [...newAgents, ...newsModels]) state.reported[`${f.kind}:${nameKey(f.name)}`] ??= date;
state.openRouterIds = [...new Set([...state.openRouterIds, ...routerModels.map((m) => m.id)])];
state.lastRun = now.toISOString();
writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);

console.log(md);
console.error(`Report: ${path.relative(projectRoot, reportPath)}`);
