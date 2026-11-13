export const CREDIT_CURRENCY = "USD";

/** One pack per order. Bought credits keep their value when prices change: the ledger counts credits, not money. */
export const CREDIT_PACKS = [
  { id: "one", credits: 1, priceCents: 399 },
  { id: "three", credits: 3, priceCents: 599 },
  { id: "ten", credits: 10, priceCents: 999 },
] as const;

export type CreditPackId = (typeof CREDIT_PACKS)[number]["id"];

export function creditPack(id: unknown) {
  return CREDIT_PACKS.find((pack) => pack.id === id) ?? null;
}

export function packTotal(id: unknown) {
  const pack = creditPack(id);
  if (!pack) return null;
  return { pack: pack.id, quantity: 1, credits: pack.credits, amountCents: pack.priceCents, currency: CREDIT_CURRENCY };
}

/** "$3.99 for 1 credit · $5.99 for 3 · $9.99 for 10" */
export function packSummary() {
  return CREDIT_PACKS.map((pack, index) => `$${formatCents(pack.priceCents)} for ${pack.credits}${index === 0 ? (pack.credits === 1 ? " credit" : " credits") : ""}`).join(" · ");
}

export function formatCents(cents: number) {
  return (cents / 100).toFixed(2);
}

export async function creditBalance(db: D1Database, userId: string) {
  const row = await db.prepare("SELECT COALESCE(SUM(delta), 0) AS balance FROM credit_ledger WHERE user_id = ?").bind(userId).first<{ balance: number }>();
  return Number(row?.balance ?? 0);
}

/** Spends one credit only when the balance covers it; check `meta.changes`. */
export function spendCreditStatement(db: D1Database, userId: string, submissionId: string, now: number) {
  return db
    .prepare("INSERT INTO credit_ledger (id, user_id, delta, kind, reference, note, created_at) SELECT ?, ?, -1, 'spend', ?, NULL, ? WHERE (SELECT COALESCE(SUM(delta), 0) FROM credit_ledger WHERE user_id = ?) >= 1")
    .bind(`credit_${crypto.randomUUID()}`, userId, submissionId, now, userId);
}

export function creditEntryStatement(db: D1Database, entry: { userId: string; delta: number; kind: "purchase" | "refund_rejected" | "refund_failed" | "reversal" | "adjustment"; reference: string; note?: string | null }, now: number) {
  return db
    .prepare("INSERT INTO credit_ledger (id, user_id, delta, kind, reference, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(kind, reference) DO NOTHING")
    .bind(`credit_${crypto.randomUUID()}`, entry.userId, entry.delta, entry.kind, entry.reference, entry.note ?? null, now);
}

export type LedgerEntry = { delta: number; kind: string; reference: string; createdAt: number };

export async function listLedger(db: D1Database, userId: string, limit = 50): Promise<LedgerEntry[]> {
  const { results } = await db
    .prepare("SELECT delta, kind, reference, created_at FROM credit_ledger WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?")
    .bind(userId, limit)
    .all<{ delta: number; kind: string; reference: string; created_at: number }>();
  return results.map((row) => ({ delta: row.delta, kind: row.kind, reference: row.reference, createdAt: row.created_at }));
}

export type AccountSubmission = { name: string; domain: string; status: string; funding: string | null; createdAt: number; toolSlug: string | null; moderationNote: string | null };

export async function listAccountSubmissions(db: D1Database, userId: string, limit = 50): Promise<AccountSubmission[]> {
  const { results } = await db
    .prepare("SELECT s.submitted_name, s.canonical_domain, s.status, s.funding, s.created_at, s.moderation_note, t.slug AS tool_slug FROM submissions s LEFT JOIN tools t ON t.canonical_domain = s.canonical_domain AND t.status = 'published' WHERE s.user_id = ? ORDER BY s.created_at DESC LIMIT ?")
    .bind(userId, limit)
    .all<{ submitted_name: string; canonical_domain: string; status: string; funding: string | null; created_at: number; moderation_note: string | null; tool_slug: string | null }>();
  return results.map((row) => ({ name: row.submitted_name, domain: row.canonical_domain, status: row.status, funding: row.funding, createdAt: row.created_at, toolSlug: row.tool_slug, moderationNote: row.status === "rejected" ? row.moderation_note : null }));
}

/** Refund and account requests; forwarded by Fastmail. */
export const SUPPORT_EMAIL = "support@ordalin.com";
