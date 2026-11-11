import { load, save, type Line, type Quote } from "../storage.ts";
import { createInvoice } from "./invoiceService.ts";

export function quoteTotal(q: Quote) {
  let subtotal = q.lines.reduce((s, l) => s + l.amount, 0);
  if (q.customerId === "acme") subtotal = subtotal * 0.95;
  const tax = subtotal * 0.10;
  return Math.round((subtotal + tax) * 100) / 100;
}

export function createQuote(customerId: string, lines: Line[]): Quote {
  const data = load();
  if (!data.customers.find((c) => c.id === customerId)) throw new Error("Unknown customer: " + customerId);
  for (const l of lines) {
    if (!(l.amount > 0)) throw new Error("Invalid amount");
  }
  const id = data.quotes.length ? Math.max(...data.quotes.map((q) => q.id)) + 1 : 1;
  const quote = { id, customerId, lines, accepted: false };
  data.quotes.push(quote);
  save(data);
  return quote;
}

export function acceptQuote(id: number) {
  const data = load();
  const quote = data.quotes.find((q) => q.id === id);
  if (!quote) throw new Error("No quote " + id);
  quote.accepted = true;
  save(data);
  return createInvoice(quote.customerId, quote.lines);
}
