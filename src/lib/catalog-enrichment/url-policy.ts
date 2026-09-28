const PRIVATE_IPV4 = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(?:1[6-9]|2\d|3[01])\./,
];

export function assertPublicHttpsUrl(input: string) {
  const url = new URL(input);
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");

  if (url.protocol !== "https:") throw new Error("Only HTTPS URLs can be enriched");
  if (url.username || url.password) throw new Error("Website URLs cannot contain credentials");
  if (url.port && url.port !== "443") throw new Error("Only the standard HTTPS port is allowed");
  if (
    hostname.includes(":") ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    PRIVATE_IPV4.some((pattern) => pattern.test(hostname))
  ) {
    throw new Error("Private or local network targets are not allowed");
  }
  url.hash = "";
  return url;
}

export function sameSite(left: URL, right: URL) {
  const normalize = (hostname: string) => hostname.toLowerCase().replace(/^www\./, "");
  return normalize(left.hostname) === normalize(right.hostname);
}

export function robotsAllows(robots: string, pathname: string) {
  const groups = robots.split(/\n\s*\n/);
  const rules: Array<{ allow: boolean; path: string }> = [];

  for (const group of groups) {
    const lines = group
      .split(/\r?\n/)
      .map((line) => line.replace(/#.*$/, "").trim())
      .filter(Boolean);
    const agents = lines
      .filter((line) => /^user-agent\s*:/i.test(line))
      .map((line) => line.split(":", 2)[1]?.trim().toLowerCase());
    if (!agents.includes("*")) continue;

    for (const line of lines) {
      const match = /^(allow|disallow)\s*:\s*(.*)$/i.exec(line);
      if (!match || !match[2]) continue;
      rules.push({ allow: match[1].toLowerCase() === "allow", path: match[2] });
    }
  }

  const matching = rules
    .filter((rule) => pathname.startsWith(rule.path))
    .sort((a, b) => b.path.length - a.path.length);
  return matching[0]?.allow ?? true;
}
