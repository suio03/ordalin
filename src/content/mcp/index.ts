// Registry of the /mcp pages: one entry per MDX file in servers/.
// src/lib/mcp/mcp.test.ts checks that files, entries and mcp.json match.
// Pages the maintainer asks for are published directly (AGENTS.md); others start as "draft".

import type { McpRegistry } from "@/lib/mcp/types";

export const REGISTRY: McpRegistry = {
  overview: () => import("./overview.mdx"),
  servers: {
    "codebase-memory-mcp": { status: "published", load: () => import("./servers/codebase-memory-mcp.mdx") },
    "artcraft-mcp": { status: "published", load: () => import("./servers/artcraft-mcp.mdx") },
    "ghidra-mcp": { status: "published", load: () => import("./servers/ghidra-mcp.mdx") },
  },
};
