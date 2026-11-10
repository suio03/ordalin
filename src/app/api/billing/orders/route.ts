import { getCloudflareEnv } from "@/lib/cloudflare";
import { readCookie } from "@/lib/account/crypto";
import { billingErrorResponse, BillingError } from "@/lib/account/billing";
import { packTotal } from "@/lib/account/credits";
import { createOrder, paypalConfig, type PayPalEnv } from "@/lib/account/paypal";
import { SESSION_COOKIE, sessionUser } from "@/lib/account/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const env = (await getCloudflareEnv()) as CloudflareEnv & PayPalEnv;
    const config = paypalConfig(env);
    if (!config) throw new BillingError("Payments are not available yet.", 503, "payments_unavailable");
    const user = await sessionUser(env.DB, readCookie(request.headers.get("cookie"), SESSION_COOKIE));
    if (!user) throw new BillingError("Sign in with Google to buy credits.", 401, "signin_required");
    const body = (await request.json().catch(() => ({}))) as { quantity?: unknown };
    const total = packTotal(Number(body.quantity));
    if (!total) throw new BillingError("Choose between 1 and 20 packs.", 400, "invalid_quantity");
    const now = Math.floor(Date.now() / 1000);
    const paymentId = `payment_${crypto.randomUUID()}`;
    await env.DB
      .prepare("INSERT INTO payments (id, user_id, provider, order_id, capture_id, quantity, credits, amount_cents, currency, status, payer_email, created_at, updated_at) VALUES (?, ?, 'paypal', ?, NULL, ?, ?, ?, ?, 'created', NULL, ?, ?)")
      .bind(paymentId, user.id, `unassigned:${paymentId}`, total.quantity, total.credits, total.amountCents, total.currency, now, now)
      .run();
    const orderId = await createOrder(config, { paymentId, userId: user.id, quantity: total.quantity, amountCents: total.amountCents });
    await env.DB.prepare("UPDATE payments SET order_id = ?, updated_at = ? WHERE id = ?").bind(orderId, now, paymentId).run();
    return Response.json({ orderId });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
