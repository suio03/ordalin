import type { FaqItem } from "@/lib/agents/content-types";
import type { HowItWorksPart, Mod, QuickstartStep, TestRun, TestSample, TestShot } from "@/lib/skills/types";

// Shapes of the MCP server pages in src/content/mcp/ (MVP_PLAN.md, "MCP servers").
// Facts live in mcp.json; each MDX file exports `meta` (Ordalin's own test) plus an MDX body.

export type McpServer = {
  slug: string;
  name: string;
  /** Who maintains this server, and whether it is the product vendor's own ("official") or a third party's ("community"). */
  maintainer: string;
  kind: "official" | "community";
  repo: string;
  license: string;
  version: string;
  /** "stdio (local)", "Streamable HTTP (remote)" or both. */
  transport: string;
  install: string;
  /** Apps, accounts or API keys the server needs before it works. */
  requires: string;
  /** Clients the repository names; "unknown" renders as "Not stated". */
  clients: string;
  /** What the server lets the agent do, in one line. */
  does: string;
  checked_on: string;
};

/** One tool the server exposes, named as the server lists it. */
export type McpTool = { name: string; text: string };

export type McpTest = {
  date: string;
  client: string;
  model: string;
  /** Repository commit or package version the test used. */
  version: string;
  /** Tool names the server listed when connected. */
  listed: string[];
  task: string;
  /** Real tool calls and answers, shown verbatim in monospace. */
  samples: TestSample[];
  runs?: TestRun[];
  shots?: TestShot[];
};

export type McpMeta = {
  title: string;
  description: string;
  /** One or two sentences for the top of the page; the full summary then opens the test section. */
  verdict?: string;
  summary: string;
  bestFor: string[];
  notFor: string[];
  /** What the server can read or change, in plain words. */
  permissions: string[];
  howItWorks?: HowItWorksPart[];
  /** Setup steps, one per client. */
  setup?: QuickstartStep[];
  tools?: McpTool[];
  test: McpTest;
  faq: FaqItem[];
};

export type McpOverviewMeta = { title: string; description: string; heading: string; intro: string };

export type McpEntry = { status: "draft" | "published"; load: () => Promise<Mod<McpMeta>> };

export type McpRegistry = { overview: () => Promise<Mod<McpOverviewMeta>>; servers: Record<string, McpEntry> };
