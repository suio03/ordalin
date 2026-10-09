// Pure helpers for scripts/radar.ts: feed parsing, the news prefilter and name matching.

export type NewsItem = { id: string; source: string; title: string; url: string; publishedAt: string };

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'", "#x27": "'", nbsp: " " };

export function decodeText(value: string | undefined): string {
  return String(value ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#?\w+);/g, (match, name: string) =>
      ENTITIES[name] ?? (/^#\d+$/.test(name) ? String.fromCodePoint(Number(name.slice(1))) : match),
    )
    .replace(/\s+/g, " ")
    .trim();
}

const tag = (xml: string, name: string) => new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(xml)?.[1];

/** RSS <item> and Atom <entry> elements. Google News titles end in " - Publisher", which stays in the title. */
export function parseFeed(xml: string, source: string): NewsItem[] {
  return [...xml.matchAll(/<(item|entry)[\s>]([\s\S]*?)<\/\1>/g)].flatMap(([, , body]) => {
    const title = decodeText(tag(body, "title"));
    const url = decodeText(tag(body, "link")) || /<link[^>]*href="([^"]+)"/.exec(body)?.[1] || "";
    const date = new Date(decodeText(tag(body, "pubDate") ?? tag(body, "published") ?? tag(body, "updated")));
    if (!title || !url || Number.isNaN(date.getTime())) return [];
    return [{ id: "", source, title, url, publishedAt: date.toISOString() }];
  });
}

const LAUNCH = /\b(launch|launches|launched|unveil|unveils|unveiled|introduc\w*|releas\w*|debut\w*|announc\w*|rolls? out|rolling out|now available|show hn|open[- ]sources?|preview|ships?)\b/i;
const SUBJECT = /\b(agent|agents|assistant|model|models|llm|gpt|claude|gemini|grok|llama|mistral|qwen|deepseek|weights)\b/i;

/** Cheap filter before the model sees a headline: it must name a launch and an agent or model. */
export const looksLikeLaunch = (title: string) => LAUNCH.test(title) && SUBJECT.test(title);

/** Lowercase letters and digits only, for matching names across sources ("GPT-6.1 Sol" ~ "gpt 6.1 sol"). */
export const nameKey = (name: string) => name.toLowerCase().replace(/^(the|a|an)\s+/, "").replace(/[^a-z0-9]/g, "");

/** OpenRouter lists variants as separate ids ("openai/gpt-6.1-sol:batch"); report each model once. */
export const baseModelId = (id: string) => id.replace(/:[a-z-]+$/, "");

/** True when `name` names an entry in `known` (exact key, or one contains the other with at least 5 characters). */
export function matchesKnown(name: string, known: Iterable<string>): boolean {
  const key = nameKey(name);
  if (!key) return false;
  for (const other of known) {
    const otherKey = nameKey(other);
    if (!otherKey) continue;
    if (key === otherKey) return true;
    const [short, long] = key.length < otherKey.length ? [key, otherKey] : [otherKey, key];
    if (short.length >= 5 && long.includes(short)) return true;
  }
  return false;
}
