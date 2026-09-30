import synced from "@/content/agents/agents.json";

// AI agent facts, synced from agentsversus data/agents.yaml (validated there before every sync).
// Rule: only official sources fill a field; anything else stays "unknown" and renders as "Not stated".

export type PaidPlan = {
  name: string;
  price_usd_month: string;
  per?: string;
  usage?: string;
  credits?: string;
  note?: string;
};

export type Agent = {
  slug: string;
  name: string;
  /** Name as people search it ("Meta Muse"), when the product name alone is ambiguous. */
  display_name?: string;
  vendor: string;
  /** "assistant" = general chatbots (ChatGPT, Grok), kept for chatbot comparisons and not listed as agents. */
  channel: "personal" | "coding" | "assistant";
  category: string;
  launch_date?: string;
  official_url: string;
  access?: {
    free_tier?: string;
    required_plan_for_agent?: string;
    paid_plans?: PaidPlan[] | "unknown";
    included?: string;
    billing_note?: string;
    subscription_note?: string;
    usage_note?: string;
  };
  platforms?: Record<string, boolean | string>;
  messaging?: string[];
  regions?: string;
  actions?: string;
  connectors_notable?: string[];
  connectors_count?: string;
  execution?: string;
  features?: string;
  ads?: string;
  safety?: string;
  privacy?: "unknown" | { training?: string; confidential_compute?: string; delete_data?: string };
  model?: string;
  license?: string;
  repo?: string;
  sources: string[];
};

const data = synced as unknown as { checkedOn: string; agents: Agent[] };

/** Date the agent facts were last checked against official sources. */
export const CHECKED_ON = data.checkedOn;

export const allAgents = (): Agent[] => data.agents;

export function getAgent(slug: string): Agent {
  const agent = data.agents.find((a) => a.slug === slug);
  if (!agent) throw new Error(`Unknown agent: ${slug}`);
  return agent;
}

/** Official pages don't say → "Not stated". Never guess. */
export const NOT_STATED = "Not stated";

export function stated(value: string | undefined | null): string {
  if (value == null) return NOT_STATED;
  const v = value.trim();
  return v === "" || v.toLowerCase() === "unknown" ? NOT_STATED : v;
}

export function paidPlans(agent: Agent): PaidPlan[] {
  const plans = agent.access?.paid_plans;
  return Array.isArray(plans) ? plans : [];
}

export function formatPrice(plan: PaidPlan): string {
  const p = plan.price_usd_month.trim();
  if (p.toLowerCase() === "unknown") return "Price not listed";
  if (/^contact/i.test(p)) return "Contact sales";
  const [amount, ...rest] = p.split("/").map((s) => s.trim());
  const unit = rest.length ? ` / ${rest.join(" / ")}` : plan.per ? ` / ${plan.per}` : "";
  return /^\d+(\.\d+)?$/.test(amount) ? `$${amount}/mo${unit}` : p;
}

/** Lowest listed monthly price; plans without a numeric price are skipped. */
export function cheapestPlan(agent: Agent): PaidPlan | undefined {
  return paidPlans(agent)
    .filter((p) => /^\d/.test(p.price_usd_month))
    .sort((x, y) => parseFloat(x.price_usd_month) - parseFloat(y.price_usd_month))[0];
}

const PLATFORM_LABELS: Record<string, string> = {
  ios: "iOS",
  ipad: "iPad",
  android: "Android",
  web: "Web",
  web_desktop: "Web (desktop)",
  desktop_app: "Desktop app",
  mobile_app: "Mobile app",
  mobile_web: "Mobile web",
  macos: "macOS",
  windows: "Windows",
  linux: "Linux",
  slack: "Slack",
  teams: "Microsoft Teams",
  sms: "SMS",
  glasses: "Glasses",
  x: "X",
};

/** Available surfaces; string values are qualifiers (e.g. "coming soon"). `false` is dropped. */
export function platformList(agent: Agent): string[] {
  return Object.entries(agent.platforms ?? {})
    .filter(([, v]) => v !== false)
    .map(([k, v]) => `${PLATFORM_LABELS[k] ?? k}${typeof v === "string" ? ` (${v})` : ""}`);
}

export const vendorShort = (agent: Agent) => agent.vendor.split(/[;(—]/)[0].trim();

export const displayName = (agent: Agent) => agent.display_name ?? agent.name;

export function hostOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
