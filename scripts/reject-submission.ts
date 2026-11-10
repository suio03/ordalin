import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { databaseMode, d1File, d1Query, sqlText } from "./lib/wrangler.ts";

// Declines a pending visitor submission. A credit submission gets its credit back
// (MVP_PLAN.md §9); a free one does not. Usage:
//   pnpm submissions:reject --remote --domain=example.com --reason="Model wrapper without its own product"
const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const mode = databaseMode();
const argument = (name: string) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const domain = argument("domain")?.trim().toLowerCase().replace(/^www\./, "");
const reason = argument("reason")?.trim();
if (!domain || !reason) throw new Error('Provide --domain=example.com and --reason="Why it was declined".');

type Row = { submission_id: string; user_id: string | null; funding: string | null; tool_id: string | null };
const [row] = await d1Query<Row>(projectRoot, mode, `SELECT s.id AS submission_id, s.user_id, s.funding, t.id AS tool_id FROM submissions s LEFT JOIN tools t ON t.canonical_domain = s.canonical_domain AND t.status = 'pending_review' WHERE s.canonical_domain = ${sqlText(domain)} AND s.status = 'pending' ORDER BY s.created_at DESC LIMIT 1`);
if (!row) throw new Error(`No pending submission for ${domain}.`);

const now = Math.floor(Date.now() / 1000);
const refund = row.funding === "credit" && row.user_id;
await d1File(projectRoot, mode, [
  `UPDATE submissions SET status = 'rejected', moderation_note = ${sqlText(reason)}, updated_at = ${now} WHERE id = ${sqlText(row.submission_id)}`,
  ...(row.tool_id ? [
    `UPDATE tools SET status = 'rejected', updated_at = ${now} WHERE id = ${sqlText(row.tool_id)} AND status = 'pending_review'`,
    `INSERT INTO moderation_events (id, entity_type, entity_id, action, actor_identity, metadata_json, created_at) VALUES (${sqlText(`event_${randomUUID()}`)}, 'tool', ${sqlText(row.tool_id)}, 'reject', 'maintainer', ${sqlText(JSON.stringify({ submissionId: row.submission_id, reason, funding: row.funding, creditReturned: Boolean(refund) }))}, ${now})`,
  ] : []),
  // Keyed by submission, so running this twice cannot return two credits.
  ...(refund ? [`INSERT INTO credit_ledger (id, user_id, delta, kind, reference, note, created_at) VALUES (${sqlText(`credit_${randomUUID()}`)}, ${sqlText(row.user_id!)}, 1, 'refund_rejected', ${sqlText(row.submission_id)}, ${sqlText(reason)}, ${now}) ON CONFLICT(kind, reference) DO NOTHING`] : []),
]);
console.log(`${domain}: declined${refund ? ", 1 credit returned" : row.funding === "free" ? ", free submission not returned" : ""}.`);
