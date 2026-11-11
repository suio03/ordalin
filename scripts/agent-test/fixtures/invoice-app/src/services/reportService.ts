import { load } from "../storage.ts";
import { state } from "../state.ts";
import { formatMoney } from "../lib/money.ts";

export function outstandingTotal() {
  const data = load();
  let total = 0;
  for (const inv of data.invoices) {
    if (inv.isSent && !inv.isPaid && !inv.isCancelled) {
      let subtotal = inv.lines.reduce((s, l) => s + l.amount, 0);
      if (inv.customerId === "acme") subtotal = subtotal * 0.95;
      total += subtotal * 1.1;
    }
  }
  return Math.round(total * 100) / 100;
}

export function paidTotal() {
  const data = load();
  let total = 0;
  for (const inv of data.invoices) {
    if (inv.isPaid) {
      let subtotal = inv.lines.reduce((s, l) => s + l.amount, 0);
      if (inv.customerId === "acme") subtotal = subtotal * 0.95;
      total += subtotal * 1.1;
    }
  }
  return Math.round(total * 100) / 100;
}

export function report() {
  state.reportMode = true;
  const lines = [
    "Outstanding: " + formatMoney(outstandingTotal()),
    "Paid:        " + formatMoney(paidTotal()),
  ];
  state.reportMode = false;
  return lines.join("\n");
}
