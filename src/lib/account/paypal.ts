import { CREDIT_PACK, formatCents } from "./credits";

export type PayPalEnv = { PAYPAL_CLIENT_ID?: string; PAYPAL_CLIENT_SECRET?: string; PAYPAL_WEBHOOK_ID?: string; PAYPAL_ENV?: string };
export type PayPalConfig = { clientId: string; clientSecret: string; webhookId: string | null; apiBase: string };

export function paypalConfig(env: PayPalEnv): PayPalConfig | null {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) return null;
  return {
    clientId: env.PAYPAL_CLIENT_ID,
    clientSecret: env.PAYPAL_CLIENT_SECRET,
    webhookId: env.PAYPAL_WEBHOOK_ID ?? null,
    apiBase: env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com",
  };
}

async function accessToken(config: PayPalConfig) {
  const response = await fetch(`${config.apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: { authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`, "content-type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`PayPal auth failed (${response.status})`);
  return ((await response.json()) as { access_token: string }).access_token;
}

async function call<T>(config: PayPalConfig, path: string, init: { method: string; body?: unknown; requestId?: string }) {
  const response = await fetch(`${config.apiBase}${path}`, {
    method: init.method,
    headers: {
      authorization: `Bearer ${await accessToken(config)}`,
      "content-type": "application/json",
      ...(init.requestId ? { "paypal-request-id": init.requestId } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await response.json().catch(() => ({}))) as T;
  return { ok: response.ok, status: response.status, json };
}

export async function createOrder(config: PayPalConfig, order: { paymentId: string; userId: string; quantity: number; amountCents: number }) {
  const unit = formatCents(CREDIT_PACK.priceCents);
  const total = formatCents(order.amountCents);
  const result = await call<{ id?: string; status?: string }>(config, "/v2/checkout/orders", {
    method: "POST",
    requestId: order.paymentId,
    body: {
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: order.paymentId,
        custom_id: order.userId,
        description: `Ordalin listing credits (${order.quantity * CREDIT_PACK.credits})`,
        amount: { currency_code: CREDIT_PACK.currency, value: total, breakdown: { item_total: { currency_code: CREDIT_PACK.currency, value: total } } },
        items: [{ name: `Ordalin listing credits, ${CREDIT_PACK.credits} per pack`, quantity: String(order.quantity), unit_amount: { currency_code: CREDIT_PACK.currency, value: unit }, category: "DIGITAL_GOODS" }],
      }],
      payment_source: { paypal: { experience_context: { brand_name: "Ordalin", shipping_preference: "NO_SHIPPING", user_action: "PAY_NOW" } } },
    },
  });
  if (!result.ok || !result.json.id) throw new Error(`PayPal order failed (${result.status})`);
  return result.json.id;
}

export type CaptureSummary = { status: string; captureId: string | null; captureStatus: string | null; amountCents: number | null; currency: string | null; payerEmail: string | null; referenceId: string | null };

type OrderJson = {
  status?: string;
  payer?: { email_address?: string };
  purchase_units?: { reference_id?: string; payments?: { captures?: { id: string; status: string; amount?: { value: string; currency_code: string } }[] } }[];
};

function summarize(json: OrderJson): CaptureSummary {
  const unit = json.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  return {
    status: json.status ?? "UNKNOWN",
    captureId: capture?.id ?? null,
    captureStatus: capture?.status ?? null,
    amountCents: capture?.amount ? Math.round(Number(capture.amount.value) * 100) : null,
    currency: capture?.amount?.currency_code ?? null,
    payerEmail: json.payer?.email_address ?? null,
    referenceId: unit?.reference_id ?? null,
  };
}

export async function captureOrder(config: PayPalConfig, orderId: string): Promise<CaptureSummary> {
  const result = await call<OrderJson & { details?: { issue?: string }[] }>(config, `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, { method: "POST", body: {}, requestId: `capture-${orderId}` });
  if (result.ok) return summarize(result.json);
  // A repeated capture reports ORDER_ALREADY_CAPTURED; read the order instead.
  if (result.json.details?.some((detail) => detail.issue === "ORDER_ALREADY_CAPTURED")) {
    const order = await call<OrderJson>(config, `/v2/checkout/orders/${encodeURIComponent(orderId)}`, { method: "GET" });
    if (order.ok) return summarize(order.json);
  }
  throw new Error(`PayPal capture failed (${result.status})`);
}

export async function verifyWebhook(config: PayPalConfig, headers: Headers, event: unknown) {
  if (!config.webhookId) return false;
  const result = await call<{ verification_status?: string }>(config, "/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: {
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: config.webhookId,
      webhook_event: event,
    },
  });
  return result.ok && result.json.verification_status === "SUCCESS";
}
