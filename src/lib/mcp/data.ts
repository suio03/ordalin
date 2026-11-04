import source from "@/content/mcp/mcp.json";
import { REGISTRY } from "@/content/mcp";
import { editorialPreviewEnabled } from "@/lib/editorial";
import type { McpServer } from "./types";

// MCP server facts, edited in src/content/mcp/mcp.json and validated by mcp.test.ts.
// Rule: only the server's own repository or vendor docs fill a field; anything else stays "unknown".

export { NOT_STATED, stated } from "@/lib/skills/data";
/** Three published pages before the hub is indexed and linked (MVP_PLAN.md, "MCP servers"). */
export const HUB_INDEX_MINIMUM = 3;

export const allServers = () => source.servers as McpServer[];

export function getServer(slug: string): McpServer {
  const server = allServers().find((s) => s.slug === slug);
  if (!server) throw new Error(`Unknown MCP server: ${slug}`);
  return server;
}

export const OVERVIEW = REGISTRY.overview;

/** Drafts render locally for review; production serves only published pages. */
export const visibleServerSlugs = () =>
  Object.entries(REGISTRY.servers)
    .filter(([, entry]) => entry.status === "published" || editorialPreviewEnabled())
    .map(([slug]) => slug);

export const publishedServerSlugs = () =>
  Object.entries(REGISTRY.servers)
    .filter(([, entry]) => entry.status === "published")
    .map(([slug]) => slug);

export function loadServerPage(slug: string) {
  const entry = REGISTRY.servers[slug];
  return entry && visibleServerSlugs().includes(slug) ? entry.load() : null;
}

export const mcpPath = { overview: "/mcp", server: (slug: string) => `/mcp/${slug}` };

/** Published /mcp URLs, for the sitemap. The hub joins once it is indexable. */
export function allMcpPaths() {
  const published = publishedServerSlugs();
  return [...(published.length >= HUB_INDEX_MINIMUM ? [mcpPath.overview] : []), ...published.map(mcpPath.server)];
}
