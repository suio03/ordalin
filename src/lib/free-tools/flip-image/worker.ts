/// <reference lib="webworker" />
// Lossless JPEG flips run here, in the visitor's browser. Nothing is sent over the network.
import type { Orient } from "./orient";
import { transformJpeg, UnsupportedJpeg } from "./jpeg-lossless";

export type FlipRequest = { id: number; bytes: ArrayBuffer; orient: Orient };
export type FlipReply =
  | {
      id: number;
      ok: true;
      bytes: ArrayBuffer;
      width: number;
      height: number;
      trimmed: { x: number; y: number };
    }
  | { id: number; ok: false; unsupported: boolean; error: string };

self.onmessage = (e: MessageEvent<FlipRequest>) => {
  const { id, bytes, orient } = e.data;
  try {
    const r = transformJpeg(new Uint8Array(bytes), orient);
    const out = r.bytes.buffer.slice(
      r.bytes.byteOffset,
      r.bytes.byteOffset + r.bytes.byteLength,
    ) as ArrayBuffer;
    const reply: FlipReply = {
      id,
      ok: true,
      bytes: out,
      width: r.width,
      height: r.height,
      trimmed: r.trimmed,
    };
    self.postMessage(reply, { transfer: [out] });
  } catch (err) {
    const reply: FlipReply = {
      id,
      ok: false,
      unsupported: err instanceof UnsupportedJpeg,
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(reply);
  }
};
