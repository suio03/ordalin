import { getCloudflareEnv } from "@/lib/cloudflare";
import { refundedCredits, settleCapture, type PaymentRow } from "@/lib/account/billing";
import { creditEntryStatement } from "@/lib/account/credits";
import { paypalConfig, verifyWebhook, type PayPalEnv } from "@/lib/account/paypal";

export const dynamic = "force-dynamic";

type Resource = {
  id?: string;
  status?: string;
  amount?: { value?: string; currency_code?: string };
  supplementary_data?: { related_ids?: { order_id?: string; capture_id?: string } };
  links?: { rel?: string; href?: string }[];
};

function captureIdFromLinks(resource: Resource) {
  const href = resource.links?.find((link) => link.rel === "up")?.href;
  return href?.match(/\/captures\/([^/]+)$/)?.[1] ?? null;
}

export async function POST(request: Request) {
  const env = (await getCloudflareEnv()) as CloudflareEnv & PayPalEnv;
  const config = paypalConfig(env);
  if (!config) return new Response("not configured", { status: 503 });
  const event = (await request.json().catch(() => null)) as { id?: string; event_type?: string; resource?: Resource } | null;
  if (!event?.id || !event.event_type || !event.resource) return new Response("bad request", { status: 400 });
  if (!(await verifyWebhook(config, request.headers, event))) return new Response("invalid signature", { status: 401 });
  const db = env.DB;
  const now = Math.floor(Date.now() / 1000);
  const resource = event.resource;
  try {
    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const orderId = resource.supplementary_data?.related_ids?.order_id;
      const payment = orderId ? await db.prepare("SELECT * FROM payments WHERE order_id = ?").bind(orderId).first<PaymentRow>() : null;
      if (payment && payment.status !== "completed") {
        await settleCapture(db, payment, { status: "COMPLETED", captureId: resource.id ?? null, captureStatus: "COMPLETED", amountCents: Math.round(Number(resource.amount?.value) * 100), currency: resource.amount?.currency_code ?? null, payerEmail: null, referenceId: null }, now);
      }
    } else if (event.event_type === "PAYMENT.CAPTURE.REFUNDED" || event.event_type === "PAYMENT.CAPTURE.REVERSED") {
      // A refund resource links up to its capture; a reversal is the capture itself.
      const captureId = event.event_type === "PAYMENT.CAPTURE.REVERSED" ? resource.id : captureIdFromLinks(resource) ?? resource.supplementary_data?.related_ids?.capture_id;
      const payment = captureId ? await db.prepare("SELECT * FROM payments WHERE capture_id = ?").bind(captureId).first<PaymentRow>() : null;
      if (payment) {
        const reversed = event.event_type === "PAYMENT.CAPTURE.REVERSED";
        const credits = reversed ? payment.credits : refundedCredits(payment, Math.round(Number(resource.amount?.value) * 100));
        const fully = reversed || credits >= payment.credits;
        await db.batch([
          ...(credits > 0 ? [creditEntryStatement(db, { userId: payment.user_id, delta: -credits, kind: "reversal", reference: `${event.event_type}:${resource.id ?? event.id}`, note: reversed ? "PayPal chargeback" : "PayPal refund" }, now)] : []),
          db.prepare("UPDATE payments SET status = ?, updated_at = ? WHERE id = ?").bind(reversed ? "reversed" : fully ? "refunded" : "partially_refunded", now, payment.id),
          // A chargeback blocks the account; existing listings are reviewed by hand.
          ...(reversed ? [db.prepare("UPDATE users SET status = 'blocked' WHERE id = ?").bind(payment.user_id)] : []),
        ]);
      }
    }
    return new Response("ok");
  } catch (error) {
    console.error("PayPal webhook failed", event.event_type, error);
    return new Response("retry", { status: 500 });
  }
}
