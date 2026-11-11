import { state } from "../state.ts";

export function round(n: number) {
  return Math.round(n * 100) / 100;
}

export function formatMoney(amount: number, isReportMode: boolean = state.reportMode) {
  const symbol = state.currency === "EUR" ? "€" : state.currency === "GBP" ? "£" : "$";
  const fixed = (Math.round(amount * 100) / 100).toFixed(2);
  if (isReportMode) return fixed.padStart(10) + " " + state.currency;
  return symbol + fixed;
}
