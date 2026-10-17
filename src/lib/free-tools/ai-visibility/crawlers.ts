/**
 * Crawlers whose robots.txt rules decide whether AI answer engines can read a
 * site. Purposes follow each vendor's own crawler documentation.
 *
 * - `answers`: indexes or fetches pages that AI search and answers cite.
 * - `user`: fetches a page when a person asks about it; the vendor says
 *   robots.txt may not apply, so a block is a weak signal either way.
 * - `mixed`: one token controls both training and answer grounding.
 * - `training`: collects content for model training only. Blocking it is a
 *   legitimate policy choice and never counts against visibility.
 */
export type CrawlerPurpose = "answers" | "user" | "mixed" | "training";

export type Crawler = {
  token: string;
  owner: string;
  purpose: CrawlerPurpose;
  use: string;
};

export const crawlers: Crawler[] = [
  { token: "OAI-SearchBot", owner: "OpenAI", purpose: "answers", use: "ChatGPT search results" },
  { token: "Claude-SearchBot", owner: "Anthropic", purpose: "answers", use: "Claude search results" },
  { token: "Claude-User", owner: "Anthropic", purpose: "answers", use: "Pages Claude fetches when a user asks" },
  { token: "PerplexityBot", owner: "Perplexity", purpose: "answers", use: "Perplexity search results" },
  { token: "Googlebot", owner: "Google", purpose: "answers", use: "Google Search, AI Overviews and AI Mode" },
  { token: "Bingbot", owner: "Microsoft", purpose: "answers", use: "Bing and Microsoft Copilot answers" },
  { token: "Applebot", owner: "Apple", purpose: "answers", use: "Siri and Spotlight suggestions" },
  { token: "DuckAssistBot", owner: "DuckDuckGo", purpose: "answers", use: "DuckDuckGo AI-assisted answers" },
  { token: "ChatGPT-User", owner: "OpenAI", purpose: "user", use: "Pages ChatGPT opens when a user asks" },
  { token: "Perplexity-User", owner: "Perplexity", purpose: "user", use: "Pages Perplexity opens when a user asks" },
  { token: "Google-Extended", owner: "Google", purpose: "mixed", use: "Gemini training and grounding in Gemini Apps" },
  { token: "GPTBot", owner: "OpenAI", purpose: "training", use: "OpenAI model training" },
  { token: "ClaudeBot", owner: "Anthropic", purpose: "training", use: "Anthropic model training" },
  { token: "Applebot-Extended", owner: "Apple", purpose: "training", use: "Apple model training" },
  { token: "CCBot", owner: "Common Crawl", purpose: "training", use: "Open dataset used to train many models" },
  { token: "Meta-ExternalAgent", owner: "Meta", purpose: "training", use: "Meta model training" },
  { token: "Bytespider", owner: "ByteDance", purpose: "training", use: "ByteDance model training" },
];

/** User agents for the live response probe; each contains the crawler's product token. */
export const probeAgents = [
  { token: "OAI-SearchBot", userAgent: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.4; +https://openai.com/searchbot" },
  { token: "Claude-SearchBot", userAgent: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +https://www.anthropic.com)" },
  { token: "PerplexityBot", userAgent: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)" },
];

export const browserUserAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
