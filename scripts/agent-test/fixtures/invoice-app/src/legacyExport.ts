// CSV export from the first version. Not used any more.
import { load } from "./storage.ts";
export function exportCsv() {
  const data = load();
  return data.invoices.map((i) => [i.id, i.customerId, i.isPaid ? "paid" : "open"].join(",")).join("\n");
}
