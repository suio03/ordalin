/// <reference lib="webworker" />
// All file processing runs here, in the visitor's browser. Nothing is sent over the network.
import { clean, open, scan, UnsupportedError, type Mode } from "./index.ts";

export type WorkerRequest =
  | { id: number; type: "scan"; bytes: ArrayBuffer }
  | { id: number; type: "clean"; bytes: ArrayBuffer; mode: Mode };

const same = (a: Uint8Array, b: Uint8Array) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;
  const b = new Uint8Array(msg.bytes);
  try {
    if (msg.type === "scan") {
      self.postMessage({ id: msg.id, ok: true, scan: scan(b, { residual: true }) });
      return;
    }
    const r = clean(b, msg.mode);
    const imageSame = same(open(b).imageData(), open(r.bytes).imageData());
    const out = r.bytes.buffer.slice(r.bytes.byteOffset, r.bytes.byteOffset + r.bytes.byteLength) as ArrayBuffer;
    self.postMessage({ id: msg.id, ok: true, result: { ...r, bytes: out, imageSame } }, { transfer: [out] });
  } catch (err) {
    const unsupported = err instanceof UnsupportedError;
    self.postMessage({ id: msg.id, ok: false, unsupported, error: err instanceof Error ? err.message : String(err) });
  }
};
