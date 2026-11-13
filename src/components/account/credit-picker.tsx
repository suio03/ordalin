"use client";

import { type CSSProperties, type ReactNode, useState } from "react";
import { CREDIT_PACKS, formatCents } from "@/lib/account/credits";
import { SignInGate } from "./sign-in";
import styles from "./pricing.module.css";

const SINGLE = CREDIT_PACKS[0].priceCents;
const label = (count: number) => `${count} ${count === 1 ? "credit" : "credits"}`;

/** Credits card on /pricing: a 1 · 3 · 10 slider that updates the price and the buy button. */
export function CreditPicker({ features }: { features: ReactNode }) {
  const [index, setIndex] = useState(1);
  const pack = CREDIT_PACKS[index];
  const each = Math.round(pack.priceCents / pack.credits);
  const saving = Math.round((1 - pack.priceCents / (SINGLE * pack.credits)) * 100);

  return (
    <>
      <div className={styles.priceRow}>
        <p className={styles.price}>
          <strong>${formatCents(pack.priceCents)}</strong>
          <span>{label(pack.credits)} · ${formatCents(each)} per listing</span>
        </p>
        {saving > 0 ? <p className={styles.saving}>Save {saving}%</p> : null}
      </div>

      <div className={styles.picker}>
        <label htmlFor="credit-pack">How many listings?</label>
        <input
          id="credit-pack"
          type="range"
          min={0}
          max={CREDIT_PACKS.length - 1}
          step={1}
          value={index}
          aria-valuetext={`${label(pack.credits)} for $${formatCents(pack.priceCents)}`}
          style={{ "--fill": `${(index / (CREDIT_PACKS.length - 1)) * 100}%` } as CSSProperties}
          onChange={(event) => setIndex(Number(event.target.value))}
        />
        <div className={styles.ticks}>
          {CREDIT_PACKS.map((item, i) => (
            <button key={item.id} type="button" data-active={i === index ? "" : undefined} onClick={() => setIndex(i)}>
              {item.credits}
            </button>
          ))}
        </div>
      </div>

      {features}

      <SignInGate className={styles.primary} next={`/account?pack=${pack.id}#buy`} reason="buy">Buy {label(pack.credits)}</SignInGate>
    </>
  );
}
