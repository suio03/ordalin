/// <reference lib="webworker" />
import { openBook, type OpenResult } from "./open";

// Parsing happens here so a large workbook never blocks the page.

export type WorkerRequest = { id: number; bytes: ArrayBuffer; name: string; password?: string };
export type WorkerReply = { id: number; result: OpenResult };

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { id, bytes, name, password } = e.data;
  const result = await openBook(new Uint8Array(bytes), name, password);
  (self as DedicatedWorkerGlobalScope).postMessage({ id, result } satisfies WorkerReply);
};
