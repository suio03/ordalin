import { SubmissionError } from "./http";

const HOUR_SECONDS = 60 * 60;

export function clientAddress(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unavailable"
  );
}

export async function actorHash(address: string, salt: string) {
  const bytes = new TextEncoder().encode(`${salt}:${address}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function submissionHashSalt(secret: string | undefined) {
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new SubmissionError(
      "Submission protection is not configured.",
      503,
      "submission_protection_unavailable",
    );
  }
  return "ordalin-local-submission";
}

export async function consumeSubmissionLimit(
  database: D1Database,
  hash: string,
  action: "enrich" | "publish",
  limit: number,
) {
  const now = Math.floor(Date.now() / 1000);
  const count = await database
    .prepare(
      "SELECT COUNT(*) AS total FROM submission_attempts WHERE actor_hash = ? AND action = ? AND created_at >= ?",
    )
    .bind(hash, action, now - HOUR_SECONDS)
    .first<{ total: number }>();
  if (Number(count?.total ?? 0) >= limit) {
    throw new SubmissionError(
      "Too many submission attempts. Please try again later.",
      429,
      "rate_limited",
    );
  }
  await database.batch([
    database
      .prepare("INSERT INTO submission_attempts (id, actor_hash, action, created_at) VALUES (?, ?, ?, ?)")
      .bind(crypto.randomUUID(), hash, action, now),
    database
      .prepare("DELETE FROM submission_attempts WHERE created_at < ?")
      .bind(now - 86_400),
  ]);
}
