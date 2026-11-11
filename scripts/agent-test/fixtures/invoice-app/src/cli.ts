#!/usr/bin/env node
import { state } from "./state.ts";
import { CONFIG } from "./config.ts";
import { runHook } from "./plugins.ts";
import { addCustomer, listCustomers } from "./services/customerService.ts";
import { createInvoice, sendInvoice, payInvoice, cancelInvoice, invoiceTotal, invoiceStatus } from "./services/invoiceService.ts";
import { createQuote, acceptQuote, quoteTotal } from "./services/quoteService.ts";
import { report } from "./services/reportService.ts";
import { formatMoney } from "./lib/money.ts";
import { load } from "./storage.ts";

state.currency = process.env.INVOICE_CURRENCY ?? CONFIG.defaultCurrency;

const [cmd, sub, ...rest] = process.argv.slice(2);

function main() {
  if (cmd === "customer" && sub === "add") {
    const [id, name, email] = rest;
    addCustomer(id, name, email);
    console.log("Added " + id);
  } else if (cmd === "customer" && sub === "list") {
    for (const c of listCustomers()) console.log(c.id + "  " + c.name + "  " + c.email);
  } else if (cmd === "invoice" && sub === "new") {
    const [customerId, description, amount] = rest;
    const inv = createInvoice(customerId, [{ description, amount: Number(amount) }]);
    if (CONFIG.enablePlugins) runHook("onInvoiceCreated", inv.id);
    console.log("Invoice " + inv.id + " " + formatMoney(invoiceTotal(inv), false));
  } else if (cmd === "invoice" && sub === "send") {
    sendInvoice(Number(rest[0]));
    console.log("Sent " + rest[0]);
  } else if (cmd === "invoice" && sub === "pay") {
    payInvoice(Number(rest[0]));
    console.log("Paid " + rest[0]);
  } else if (cmd === "invoice" && sub === "cancel") {
    cancelInvoice(Number(rest[0]));
    console.log("Cancelled " + rest[0]);
  } else if (cmd === "invoice" && sub === "list") {
    for (const inv of load().invoices) console.log(inv.id + "  " + inv.customerId + "  " + invoiceStatus(inv) + "  " + formatMoney(invoiceTotal(inv), false));
  } else if (cmd === "quote" && sub === "new") {
    const [customerId, description, amount] = rest;
    const q = createQuote(customerId, [{ description, amount: Number(amount) }]);
    console.log("Quote " + q.id + " " + formatMoney(quoteTotal(q), false));
  } else if (cmd === "quote" && sub === "accept") {
    const inv = acceptQuote(Number(rest[0]));
    if (CONFIG.enablePlugins) runHook("onInvoiceCreated", inv.id);
    console.log("Invoice " + inv.id + " from quote " + rest[0]);
  } else if (cmd === "report") {
    console.log(report());
  } else {
    console.log("Usage: invoice <customer|invoice|quote|report> ...");
    process.exitCode = 1;
  }
}

try {
  main();
} catch (e) {
  console.error((e as Error).message);
  process.exitCode = 1;
}
