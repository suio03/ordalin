import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import source from "@/content/agents/agents.json";
import { REGISTRY } from "@/content/agents";
import { allAgentsPaths } from "./content";
import { allAgents, formatPrice, getAgent, NOT_STATED, stated } from "./data";

const CONTENT = join(process.cwd(), "src", "content", "agents");
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isUrl = (value: unknown) => typeof value === "string" && /^https?:\/\//.test(value) && URL.canParse(value);

const AGENT_KEYS = new Set([
  "slug", "name", "display_name", "vendor", "channel", "category", "launch_date", "official_url", "checked_on",
  "catalogue_slug", "access", "platforms", "messaging", "regions", "actions", "connectors_notable", "connectors_count",
  "execution", "features", "ads", "safety", "privacy", "model", "license", "repo", "sources",
]);
const ACCESS_KEYS = new Set([
  "free_tier", "required_plan_for_agent", "paid_plans", "included", "billing_note", "subscription_note", "usage_note",
]);
const PLAN_KEYS = new Set(["name", "price_usd_month", "per", "usage", "credits", "note"]);

/** Facts that break the page templates, or that do not belong in the public repository. */
function problems(agent: Record<string, unknown>): string[] {
  const out: string[] = [];
  const unknownKeys = (obj: object, allowed: Set<string>, at: string) =>
    Object.keys(obj).filter((k) => !allowed.has(k)).forEach((k) => out.push(`unexpected field ${at}${k}`));
  unknownKeys(agent, AGENT_KEYS, "");
  for (const key of ["name", "vendor", "category"]) if (typeof agent[key] !== "string" || !agent[key]) out.push(`${key} missing`);
  if (!/^[a-z0-9-]+$/.test(String(agent.slug))) out.push("slug must be kebab-case");
  if (!["personal", "coding"].includes(String(agent.channel))) out.push("channel must be personal or coding");
  if (!isUrl(agent.official_url)) out.push("official_url must be a URL");
  if (agent.repo !== undefined && !isUrl(agent.repo)) out.push("repo must be a URL");
  if (agent.checked_on !== undefined && !DATE.test(String(agent.checked_on))) out.push("checked_on must be YYYY-MM-DD");
  if (agent.catalogue_slug !== undefined && !/^[a-z0-9-]+$/.test(String(agent.catalogue_slug))) out.push("catalogue_slug must be kebab-case");
  const sources = agent.sources;
  if (!Array.isArray(sources) || sources.length === 0 || !sources.every(isUrl)) out.push("sources must be a non-empty list of URLs");
  const access = agent.access as Record<string, unknown> | undefined;
  if (access) {
    unknownKeys(access, ACCESS_KEYS, "access.");
    const plans = access.paid_plans;
    if (plans !== undefined && plans !== "unknown") {
      if (!Array.isArray(plans)) out.push('access.paid_plans must be a list or "unknown"');
      else
        for (const plan of plans as Record<string, unknown>[]) {
          unknownKeys(plan, PLAN_KEYS, "access.paid_plans[].");
          if (typeof plan.name !== "string" || typeof plan.price_usd_month !== "string") out.push("each paid plan needs a string name and price_usd_month");
        }
    }
  }
  return out;
}

describe("agent facts (agents.json)", () => {
  it("has a baseline check date", () => {
    expect(source.checkedOn).toMatch(DATE);
  });

  it("validates every agent", () => {
    const found = Object.fromEntries(
      (source.agents as Record<string, unknown>[])
        .map((agent) => [String(agent.slug), problems(agent)] as const)
        .filter(([, found]) => found.length),
    );
    expect(found).toEqual({});
  });

  it("has unique slugs", () => {
    const slugs = allAgents().map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("renders unknown values as Not stated", () => {
    expect(stated("unknown")).toBe(NOT_STATED);
    expect(stated(undefined)).toBe(NOT_STATED);
    expect(stated(getAgent("grok-bot").regions)).toBe(NOT_STATED);
  });

  it("formats prices without inventing numbers", () => {
    expect(formatPrice({ name: "x", price_usd_month: "20" })).toBe("$20/mo");
    expect(formatPrice({ name: "x", price_usd_month: "29.99", per: "user" })).toBe("$29.99/mo / user");
    expect(formatPrice({ name: "x", price_usd_month: "unknown" })).toBe("Price not listed");
    expect(formatPrice({ name: "x", price_usd_month: "40 / user" })).toBe("$40/mo / user");
  });
});

describe("agent page registry (index.ts)", () => {
  const kinds = {
    agents: REGISTRY.agentPages,
    compare: REGISTRY.comparisons,
    pricing: REGISTRY.pricingPages,
    alternatives: REGISTRY.alternativesPages,
    best: REGISTRY.bestPages,
    safety: REGISTRY.safetyPages,
  };

  it.each(Object.entries(kinds))("registers exactly the MDX files in %s/", (kind, registry) => {
    const files = readdirSync(join(CONTENT, kind)).filter((f) => f.endsWith(".mdx")).map((f) => f.slice(0, -4));
    expect(Object.keys(registry).sort()).toEqual(files.sort());
  });

  it("refers only to known agents", () => {
    const known = new Set(allAgents().map((a) => a.slug));
    const referenced = [
      ...Object.values(REGISTRY.comparisons).flatMap((c) => c.sides),
      ...Object.keys(REGISTRY.pricingPages),
      ...Object.values(REGISTRY.pricingPages).flatMap((p) => p.compareWith),
      ...Object.keys(REGISTRY.agentPages),
    ];
    expect(referenced.filter((slug) => !known.has(slug))).toEqual([]);
  });

  it("keeps agent slugs clear of the /agents sections", () => {
    const reserved = [...Object.keys(REGISTRY.hubs), ...Object.keys(kinds), "methodology"];
    expect(Object.keys(REGISTRY.agentPages).filter((slug) => reserved.includes(slug))).toEqual([]);
  });

  it("links only to /agents pages that exist", () => {
    const paths = new Set(allAgentsPaths());
    const mdx = readdirSync(CONTENT, { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".mdx"));
    const broken = mdx.flatMap((file) => {
      const text = readFileSync(join(CONTENT, file), "utf8");
      const links = [...text.matchAll(/\]\((\/[^)\s]*)\)|href(?:="|: ")(\/[^"]*)"/g)].map((m) => (m[1] ?? m[2]).split("#")[0]);
      return links.filter((link) => link.startsWith("/agents") && !paths.has(link)).map((link) => `${file}: ${link}`);
    });
    expect(broken).toEqual([]);
  });
});
