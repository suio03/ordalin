import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { CONFIG } from "./config.ts";
import { state } from "./state.ts";

export type Customer = { id: string; name: string; email: string };
export type Line = { description: string; amount: number };
export type Invoice = {
  id: number;
  customerId: string;
  lines: Line[];
  isSent: boolean;
  isPaid: boolean;
  isCancelled: boolean;
  sentAt?: string;
  paidAt?: string;
};
export type Quote = { id: number; customerId: string; lines: Line[]; accepted: boolean };
export type Data = { customers: Customer[]; invoices: Invoice[]; quotes: Quote[] };

const empty = (): Data => ({ customers: [], invoices: [], quotes: [] });

interface StorageDriver {
  load(file: string): Data;
  save(file: string, data: Data): void;
}

class JsonDriver implements StorageDriver {
  load(file: string): Data {
    if (!existsSync(file)) return empty();
    return JSON.parse(readFileSync(file, "utf8"));
  }
  save(file: string, data: Data) {
    writeFileSync(file, JSON.stringify(data, null, 2));
  }
}

function createDriver(kind: string): StorageDriver {
  if (kind === "json") return new JsonDriver();
  throw new Error("unknown storage driver " + kind);
}

export function load(file: string = CONFIG.dataFile): Data {
  const driver = createDriver(CONFIG.storageDriver);
  for (let attempt = 0; attempt < CONFIG.maxRetries; attempt++) {
    try {
      return driver.load(file);
    } catch (e) {
      state.lastError = String(e);
      const until = Date.now() + CONFIG.retryDelayMs;
      while (Date.now() < until) {}
    }
  }
  return empty();
}

export function save(data: Data, file: string = CONFIG.dataFile) {
  try {
    createDriver(CONFIG.storageDriver).save(file, data);
  } catch (e) {
    // ignore
  }
}
