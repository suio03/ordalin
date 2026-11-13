"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CREDIT_PACKS, formatCents, type CreditPackId } from "@/lib/account/credits";
import { trackEvent } from "@/lib/analytics";
import styles from "./account.module.css";

type PayPalButtons = { render: (target: HTMLElement) => Promise<void>; close?: () => Promise<void> };
type PayPalNamespace = {
  Buttons: (options: {
    style?: Record<string, string | number>;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onCancel?: () => void;
    onError?: (error: unknown) => void;
  }) => PayPalButtons;
};

function loadPayPal(clientId: string) {
  const id = "paypal-sdk";
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  const ready = () => (window as unknown as { paypal?: PayPalNamespace }).paypal;
  if (ready()) return Promise.resolve(ready()!);
  return new Promise<PayPalNamespace>((resolve, reject) => {
    const script = existing ?? Object.assign(document.createElement("script"), {
      id,
      src: `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&components=buttons&disable-funding=paylater`,
      async: true,
    });
    script.addEventListener("load", () => (ready() ? resolve(ready()!) : reject(new Error("PayPal did not load."))));
    script.addEventListener("error", () => reject(new Error("PayPal could not be loaded. Check your connection or ad blocker.")));
    if (!existing) document.head.appendChild(script);
  });
}

async function json(response: Response) {
  const value = (await response.json().catch(() => ({}))) as { error?: string; orderId?: string; status?: string; credits?: number };
  if (!response.ok) throw new Error(value.error ?? "Payment failed. Please try again.");
  return value;
}

export function BuyCredits({ clientId }: { clientId: string | null }) {
  const router = useRouter();
  const [pack, setPack] = useState<CreditPackId>("three");
  // PayPal keeps the first createOrder callback, so it reads the current pack from a ref.
  const packRef = useRef(pack);
  useEffect(() => { packRef.current = pack; }, [pack]);
  const target = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<{ kind: "error" | "status"; text: string } | null>(null);

  useEffect(() => {
    if (!clientId || !target.current) return;
    let buttons: PayPalButtons | null = null;
    let cancelled = false;
    loadPayPal(clientId).then((paypal) => {
      if (cancelled || !target.current) return;
      buttons = paypal.Buttons({
        style: { layout: "vertical", shape: "rect", label: "pay", height: 48 },
        async createOrder() {
          setMessage(null);
          const value = await json(await fetch("/api/billing/orders", {
            method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pack: packRef.current }),
          }));
          return value.orderId!;
        },
        async onApprove({ orderID }) {
          try {
            const value = await json(await fetch(`/api/billing/orders/${encodeURIComponent(orderID)}/capture`, { method: "POST" }));
            if (value.status === "completed") {
              trackEvent("Credits Purchased", { pack: packRef.current });
              setMessage({ kind: "status", text: `Payment received. ${value.credits} credits added.` });
            } else {
              setMessage({ kind: "status", text: "PayPal is still processing this payment. Credits are added as soon as it clears." });
            }
            router.refresh();
          } catch (error) {
            setMessage({ kind: "error", text: error instanceof Error ? error.message : "Payment failed." });
          }
        },
        onCancel() { setMessage({ kind: "status", text: "Payment cancelled. Nothing was charged." }); },
        onError(error) { setMessage({ kind: "error", text: error instanceof Error ? error.message : "PayPal reported an error. Nothing was charged." }); },
      });
      void buttons.render(target.current);
    }).catch((error: unknown) => {
      if (!cancelled) setMessage({ kind: "error", text: error instanceof Error ? error.message : "PayPal could not be loaded." });
    });
    return () => { cancelled = true; void buttons?.close?.(); };
  }, [clientId, router]);

  return (
    <div className={styles.buy}>
      <fieldset className={styles.packs}>
        <legend>Credit pack</legend>
        {CREDIT_PACKS.map((option) => (
          <label key={option.id} className={styles.pack}>
            <input type="radio" name="pack" value={option.id} checked={pack === option.id} onChange={() => setPack(option.id)} />
            <span><strong>{option.credits} {option.credits === 1 ? "credit" : "credits"}</strong><small>${formatCents(Math.round(option.priceCents / option.credits))} each</small></span>
            <b>${formatCents(option.priceCents)}</b>
          </label>
        ))}
      </fieldset>
      <p className={styles.total}>One-time payment · credits never expire</p>
      {clientId ? <div ref={target} className={styles.paypal} /> : <p className={styles.notice}>Payments open soon.</p>}
      {message ? <p className={message.kind === "error" ? styles.error : styles.notice} role={message.kind === "error" ? "alert" : "status"}>{message.text}</p> : null}
    </div>
  );
}
