/**
 * robots.txt matching per RFC 9309: a crawler obeys the groups that name its
 * product token (merged), else the `*` groups; the longest matching rule wins
 * and `allow` wins a tie. Rules support `*` and a trailing `$`.
 */
type Rule = { allow: boolean; pattern: string; line: string };
type Group = { agents: string[]; rules: Rule[] };

export type RobotsVerdict = {
  allowed: boolean;
  /** Which group applied: the crawler's own, the `*` fallback, or none at all. */
  group: "specific" | "wildcard" | "none";
  /** The rule line that decided, when one matched. */
  rule: string | null;
};

export function parseRobots(text: string) {
  const groups: Group[] = [];
  const sitemaps: string[] = [];
  let current: Group | null = null;
  let collectingAgents = false;

  for (const raw of text.split(/\r\n|\r|\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    const match = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const value = match[2].trim();

    if (key === "user-agent") {
      if (!collectingAgents || !current) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      collectingAgents = true;
    } else if (key === "allow" || key === "disallow") {
      collectingAgents = false;
      // An empty disallow allows everything and is equivalent to no rule.
      if (current && value) current.rules.push({ allow: key === "allow", pattern: value, line: `${match[1]}: ${value}` });
    } else if (key === "sitemap") {
      if (value) sitemaps.push(value);
    } else {
      collectingAgents = false;
    }
  }
  return { groups, sitemaps };
}

function patternMatches(pattern: string, path: string) {
  const anchored = pattern.endsWith("$");
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const source = body.split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  return new RegExp(`^${source}${anchored ? "$" : ""}`).test(path);
}

export function robotsVerdict(parsed: ReturnType<typeof parseRobots>, token: string, path = "/"): RobotsVerdict {
  const wanted = token.toLowerCase();
  let applicable = parsed.groups.filter((group) => group.agents.includes(wanted));
  let group: RobotsVerdict["group"] = "specific";
  if (!applicable.length) {
    applicable = parsed.groups.filter((candidate) => candidate.agents.includes("*"));
    group = applicable.length ? "wildcard" : "none";
  }

  let best: Rule | null = null;
  for (const rule of applicable.flatMap((candidate) => candidate.rules)) {
    if (!patternMatches(rule.pattern, path)) continue;
    if (
      !best ||
      rule.pattern.length > best.pattern.length ||
      (rule.pattern.length === best.pattern.length && rule.allow && !best.allow)
    ) {
      best = rule;
    }
  }
  return { allowed: best?.allow ?? true, group, rule: best?.line ?? null };
}
