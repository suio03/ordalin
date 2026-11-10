import { getCloudflareEnv } from "@/lib/cloudflare";
import { readCookie } from "@/lib/account/crypto";
import { billingErrorResponse, BillingError, settleCapture, type PaymentRow } from "@/lib/account/billing";
import { creditBalance } from "@/lib/account/credits";
import { captureOrder, paypalConfig, type PayPalEnv } from "@/lib/account/paypal";
import { SESSION_COOKIE, sessionUser } from "@/lib/account/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const env = (await getCloudflareEnv()) as CloudflareEnv & PayPalEnv;
    const config = paypalConfig(env);
    if (!config) throw new BillingError("Payments are not available yet.", 503, "payments_unavailable");
    const user = await sessionUser(env.DB, readCookie(request.headers.get("cookie"), SESSION_COOKIE));
    if (!user) throw new BillingError("Sign in with Google to buy credits.", 401, "signin_required");
    if (!/^[A-Z0-9]{8,40}$/.test(orderId)) throw new BillingError("Unknown order.", 404, "order_not_found");
    const payment = await env.DB.prepare("SELECT * FROM payments WHERE order_id = ? AND user_id = ?").bind(orderId, user.id).first<PaymentRow>();
    if (!payment) throw new BillingError("Unknown order.", 404, "order_not_found");
    const status = payment.status === "completed" ? "completed" : await settleCapture(env.DB, payment, await captureOrder(config, orderId));
    return Response.json({ status, credits: payment.credits, balance: await creditBalance(env.DB, user.id) });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
