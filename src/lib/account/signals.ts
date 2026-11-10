import { sha256Hex } from "./crypto";

export type Signal = { kind: "ip" | "ip_prefix" | "device"; valueHash: string };

const IP_WINDOW_SECONDS = 90 * 86_400;

/** The /24 of an IPv4 address or the /48 of an IPv6 address, so one home or office network groups together. */
export function ipPrefix(address: string) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(address)) return address.split(".").slice(0, 3).join(".") + ".0/24";
  if (!address.includes(":")) return null;
  const [head, tail = ""] = address.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups = address.includes("::") ? [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill("0"), ...right] : left;
  if (groups.length < 3 || groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) return null;
  return groups.slice(0, 3).map((group) => group.replace(/^0+(?=.)/, "")).join(":") + "::/48";
}

export async function requestSignals(address: string, deviceId: string | null, salt: string): Promise<Signal[]> {
  const signals: Signal[] = [];
  if (address && address !== "unavailable") {
    signals.push({ kind: "ip", valueHash: await sha256Hex(`${salt}:ip:${address}`) });
    const prefix = ipPrefix(address);
    if (prefix) signals.push({ kind: "ip_prefix", valueHash: await sha256Hex(`${salt}:prefix:${prefix}`) });
  }
  if (deviceId) signals.push({ kind: "device", valueHash: await sha256Hex(`${salt}:device:${deviceId}`) });
  return signals;
}

export function recordSignalStatements(db: D1Database, userId: string, signals: Signal[], now: number) {
  return signals.map((signal) =>
    db
      .prepare("INSERT INTO account_signals (user_id, kind, value_hash, first_seen_at, last_seen_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, kind, value_hash) DO UPDATE SET last_seen_at = excluded.last_seen_at")
      .bind(userId, signal.kind, signal.valueHash, now, now),
  );
}

export type FreeClaimState = "available" | "used" | "linked";

/**
 * The free submission is one per person. Another account that already used it
 * blocks this one when it shares the normalized email, a device cookie, or an
 * IP address seen in the last 90 days. A shared /24 alone only flags review.
 * `signals` are this request's; the account's recorded signals count too.
 */
export async function freeClaimState(db: D1Database, user: { id: string; emailNormalized: string }, signals: Signal[], now = Math.floor(Date.now() / 1000)): Promise<FreeClaimState> {
  if (await db.prepare("SELECT 1 FROM free_claims WHERE user_id = ? LIMIT 1").bind(user.id).first()) return "used";
  const byEmail = await db
    .prepare("SELECT 1 FROM free_claims f JOIN users u ON u.id = f.user_id WHERE u.id <> ? AND u.email_normalized = ? LIMIT 1")
    .bind(user.id, user.emailNormalized)
    .first();
  if (byEmail) return "linked";
  const since = now - IP_WINDOW_SECONDS;
  const current = signals.filter((signal) => signal.kind !== "ip_prefix");
  const currentClause = current.length ? ` OR (other.kind || ':' || other.value_hash) IN (${current.map(() => "?").join(", ")})` : "";
  const linked = await db
    .prepare(
      `SELECT 1 FROM free_claims f JOIN account_signals other ON other.user_id = f.user_id
       WHERE f.user_id <> ? AND (other.kind = 'device' OR (other.kind = 'ip' AND other.last_seen_at >= ?))
       AND (EXISTS (SELECT 1 FROM account_signals mine WHERE mine.user_id = ? AND mine.kind = other.kind AND mine.value_hash = other.value_hash)${currentClause})
       LIMIT 1`,
    )
    .bind(user.id, since, user.id, ...current.map((signal) => `${signal.kind}:${signal.valueHash}`))
    .first();
  return linked ? "linked" : "available";
}
