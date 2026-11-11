import { load, save, type Invoice, type Line } from "../storage.ts";
import { round } from "../lib/money.ts";

const TAX_RATE = 0.1;

export function invoiceSubtotal(inv: Invoice) {
  return inv.lines.reduce((s, l) => s + l.amount, 0);
}

export function invoiceTotal(inv: Invoice) {
  let subtotal = invoiceSubtotal(inv);
  // Acme has a negotiated 5% discount
  if (inv.customerId === "acme") subtotal = subtotal * 0.95;
  return round(subtotal + subtotal * TAX_RATE);
}

export function createInvoice(customerId: string, lines: Line[]): Invoice {
  const data = load();
  if (!data.customers.find((c) => c.id === customerId)) throw new Error("Unknown customer: " + customerId);
  for (const l of lines) {
    if (typeof l.amount !== "number" || Number.isNaN(l.amount) || l.amount <= 0) throw new Error("Invalid amount");
  }
  const id = data.invoices.length ? Math.max(...data.invoices.map((i) => i.id)) + 1 : 1;
  const inv: Invoice = { id, customerId, lines, isSent: false, isPaid: false, isCancelled: false };
  data.invoices.push(inv);
  save(data);
  return inv;
}

export function sendInvoice(id: number, now = new Date()) {
  const data = load();
  const inv = data.invoices.find((i) => i.id === id);
  if (!inv) throw new Error("No invoice " + id);
  if (inv.isCancelled) throw new Error("Invoice is cancelled");
  if (inv.isSent) return inv;
  inv.isSent = true;
  inv.sentAt = now.toISOString();
  save(data);
  return inv;
}

export function payInvoice(id: number, now = new Date()) {
  const data = load();
  const inv = data.invoices.find((i) => i.id === id);
  if (!inv) throw new Error("No invoice " + id);
  if (!inv.isSent) throw new Error("Invoice not sent yet");
  if (inv.isPaid) return inv;
  inv.isPaid = true;
  inv.paidAt = now.toISOString();
  save(data);
  return inv;
}

export function cancelInvoice(id: number) {
  const data = load();
  const inv = data.invoices.find((i) => i.id === id);
  if (!inv) throw new Error("No invoice " + id);
  if (inv.isPaid) throw new Error("Paid invoices cannot be cancelled");
  inv.isCancelled = true;
  save(data);
  return inv;
}

export function invoiceStatus(inv: Invoice) {
  if (inv.isCancelled) return "cancelled";
  if (inv.isPaid) return "paid";
  if (inv.isSent) return "sent";
  return "draft";
}
