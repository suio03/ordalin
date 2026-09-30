import { capitalize, formatPrice, paidPlans, platformList, stated, NOT_STATED, type Agent } from "./data";

const notStated = (v: string) => (v === NOT_STATED ? <span className="text-muted">{v}</span> : v);

const plansCell = (a: Agent) => {
  const plans = paidPlans(a);
  if (!plans.length) return a.access?.paid_plans === "unknown" ? notStated(NOT_STATED) : "None";
  return (
    <ul className="flex flex-col gap-1">
      {plans.map((p) => (
        <li key={p.name}>
          {p.name}: <span className="font-mono">{formatPrice(p)}</span>
          {p.note && <span className="text-muted"> ({p.note})</span>}
        </li>
      ))}
    </ul>
  );
};

const training = (a: Agent) => (a.privacy && a.privacy !== "unknown" ? stated(a.privacy.training) : NOT_STATED);

/** Rows shared by comparison and entity pages. Values come straight from agents.json. */
export function specRows(agents: Agent[]) {
  const row = (label: string, get: (a: Agent) => React.ReactNode, mono = false) => ({ label, mono, cells: agents.map(get) });
  return [
    row("Maker", (a) => a.vendor),
    row("Launched", (a) => notStated(stated(a.launch_date)), true),
    row("Free tier", (a) => notStated(capitalize(stated(a.access?.free_tier)))),
    row("Paid plans", plansCell),
    row("Plan needed", (a) => notStated(stated(a.access?.required_plan_for_agent ?? (a.access?.free_tier?.startsWith("yes") ? "Free tier" : undefined)))),
    row("Where you use it", (a) => notStated(platformList(a).join(", ") || NOT_STATED)),
    row("Availability", (a) => notStated(stated(a.regions))),
    row("How it runs", (a) => notStated(stated(a.execution))),
    row("What it can do", (a) => notStated(stated(a.actions))),
    row("Asks before acting", (a) => notStated(stated(a.safety))),
    row("Training on your data", (a) => notStated(training(a))),
    row("Model", (a) => notStated(stated(a.model))),
  ];
}

/** Rows for general chatbots (ChatGPT, Grok): plans and what they add, not agent execution details. */
export function assistantSpecRows(agents: Agent[]) {
  const row = (label: string, get: (a: Agent) => React.ReactNode, mono = false) => ({ label, mono, cells: agents.map(get) });
  return [
    row("Maker", (a) => a.vendor),
    row("Free tier", (a) => notStated(capitalize(stated(a.access?.free_tier)))),
    row("Paid plans", plansCell),
    row("Billing", (a) => notStated(stated(a.access?.billing_note))),
    row("What each plan adds", (a) => notStated(stated(a.features))),
    row("Where you use it", (a) => notStated(platformList(a).join(", ") || NOT_STATED)),
    row("Ads", (a) => notStated(stated(a.ads))),
    row("Training on your data", (a) => notStated(training(a))),
    row("Model", (a) => notStated(stated(a.model))),
  ];
}

export const NOT_STATED_NOTE = "“Not stated” means the maker’s pages don’t say — not that the feature is missing.";
