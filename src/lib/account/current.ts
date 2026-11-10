import { cookies, headers } from "next/headers";
import { getCloudflareEnv } from "@/lib/cloudflare";
import { creditBalance } from "./credits";
import { DEVICE_COOKIE, SESSION_COOKIE, sessionUser, type AccountUser } from "./session";
import { freeClaimState, requestSignals, type FreeClaimState } from "./signals";
import { submissionHashSalt } from "@/lib/submissions/request";

export type AccountSummary = { user: AccountUser; balance: number; free: FreeClaimState };

/** The signed-in submitter for a server component, or null. Read-only. */
export async function currentAccount(): Promise<AccountSummary | null> {
  const jar = await cookies();
  const env = (await getCloudflareEnv()) as CloudflareEnv & { SUBMISSION_HASH_SALT?: string };
  const user = await sessionUser(env.DB, jar.get(SESSION_COOKIE)?.value);
  if (!user) return null;
  const requestHeaders = await headers();
  const address = requestHeaders.get("cf-connecting-ip") ?? "unavailable";
  const signals = await requestSignals(address, jar.get(DEVICE_COOKIE)?.value ?? null, submissionHashSalt(env.SUBMISSION_HASH_SALT));
  const [balance, free] = await Promise.all([creditBalance(env.DB, user.id), freeClaimState(env.DB, user, signals)]);
  return { user, balance, free };
}
