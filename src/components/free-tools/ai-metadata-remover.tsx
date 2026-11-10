"use client";

import { zipSync } from "fflate";
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { trackEvent } from "@/lib/analytics";
import type { Block, CleanResult, Mode, PrivacyItem, PrivacyKind, Scan, Verdict } from "@/lib/free-tools/ai-metadata/index.ts";
import { AI_METADATA_LIMITS } from "@/lib/free-tools/ai-metadata/limits";
import styles from "./ai-metadata-remover.module.css";


type Variant = "label" | "metadata";
type Result = Omit<CleanResult, "bytes"> & { bytes: ArrayBuffer; imageSame: boolean };
type Item = { id: number; file: File; scan?: Scan; error?: string; result?: Result };
type WorkerReply = { id: number; ok: boolean; scan?: Scan; result?: Result; unsupported?: boolean; error?: string };

const FORMAT_NAME: Record<string, string> = { jpeg: "JPG", png: "PNG", webp: "WebP", heic: "HEIC", avif: "AVIF" };
const EXT: Record<string, string> = { jpeg: "jpg", png: "png", webp: "webp", heic: "heic", avif: "avif" };
const PRIVACY_ORDER: PrivacyKind[] = ["location", "device", "date", "person"];
const PRIVACY_NAME: Record<PrivacyKind, string> = { location: "Location (GPS)", device: "Camera or phone", date: "Date taken", person: "Name or author" };

const VERDICT: Record<Verdict, string> = {
  ai: "AI metadata found",
  provenance: "Content Credentials found",
  normal: "No AI metadata",
  none: "No metadata",
};

// The label page speaks about the platform label; the metadata page about what the file says.
const HINT: Record<Variant, Record<Verdict, string>> = {
  label: {
    ai: "Instagram, Facebook, Threads and TikTok read these fields to add an AI label. Cleaning removes them.",
    provenance: "This file carries a C2PA manifest (Content Credentials), which Meta and TikTok read. Cleaning removes it.",
    normal: "Only ordinary fields such as camera and date. If a platform still labels this image, the label is not coming from the file's metadata.",
    none: "This file has no metadata. If a platform still labels it, the label comes from an invisible watermark, visual detection or a manual disclosure, which no metadata tool can change.",
  },
  metadata: {
    ai: "The file names an AI generator or says it was made by AI. Cleaning removes these fields.",
    provenance: "The file carries a signed C2PA manifest (Content Credentials) with its edit history. Cleaning removes it.",
    normal: "Only ordinary metadata such as camera and date; nothing in the file points to AI.",
    none: "This file has no metadata blocks to remove.",
  },
};

const CLEAN_LABEL: Record<Variant, string> = { label: "Remove AI label data", metadata: "Remove AI metadata" };

function size(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function outName(item: Item) {
  const base = item.file.name.replace(/\.[^.]+$/, "") || "image";
  return `${base}-clean.${EXT[item.scan!.format]}`;
}

/** Kinds of metadata blocks that held AI signals, e.g. "c2pa,xmp", or "none". Never file names or contents. */
function signalKinds(items: Item[]) {
  const set = new Set(items.flatMap((item) => item.scan!.blocks.filter((b) => b.ai).map((b) => b.kind)));
  return [...set].sort().join(",") || "none";
}

const kindsOf = (items: PrivacyItem[]) => PRIVACY_ORDER.filter((k) => items.some((p) => p.kind === k));

function PrivacyList({ items }: { items: PrivacyItem[] }) {
  return (
    <div className={styles.privacy}>
      <p className={styles.privacyHead}>Personal data in this file</p>
      <ul>
        {kindsOf(items).map((kind) => {
          const values = [...new Set(items.filter((p) => p.kind === kind).map((p) => p.value))];
          return (
            <li key={kind}>
              <span>{PRIVACY_NAME[kind]}</span>
              <span>{values.slice(0, 4).join(" · ") + (values.length > 4 ? " …" : "")}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AllFields({ blocks }: { blocks: Block[] }) {
  return (
    <details className={styles.allFields}>
      <summary>All metadata ({blocks.length} {blocks.length === 1 ? "block" : "blocks"})</summary>
      {blocks.map((b) => (
        <div key={b.id} className={styles.block}>
          <p className={styles.blockHead}>
            {b.label} · {size(b.size)}
          </p>
          <dl>
            {b.fields.map((f, i) => (
              <div key={i} data-ai={f.ai ? "true" : undefined}>
                <dt>{f.key}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </details>
  );
}

function FileCard({ item, variant, mode, onDownload }: { item: Item; variant: Variant; mode: Mode; onDownload: (item: Item) => void }) {
  const s = item.scan;
  const r = item.result;
  const left = r ? [...r.after.signals.map((f) => f.key), ...r.after.residual] : [];
  const keptPrivacy = r ? kindsOf(r.after.privacy) : [];
  return (
    <li className={styles.file}>
      <div className={styles.fileHead}>
        <span className={styles.fileName}>{item.file.name}</span>
        <span className={styles.meta}>{[s ? FORMAT_NAME[s.format] : "", size(item.file.size)].filter(Boolean).join(" · ")}</span>
        {s ? (
          <span className={styles.badge} data-verdict={s.verdict}>
            {VERDICT[s.verdict]}
          </span>
        ) : null}
      </div>
      {item.error ? <p className={styles.error}>{item.error}</p> : null}
      {!item.error && !s ? <p className={styles.meta}>Reading metadata…</p> : null}
      {s ? (
        <>
          <p className={styles.hint}>{HINT[variant][s.verdict]}</p>
          {s.signals.length ? (
            <ul className={styles.signals}>
              {s.signals.map((f, i) => (
                <li key={i}>
                  <span className={styles.where}>{f.label}</span>
                  <code>{f.key}</code>
                  <span className={styles.value}>{f.value}</span>
                  {f.reason ? <span className={styles.reason}>{f.reason}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
          {s.privacy.length ? <PrivacyList items={s.privacy} /> : null}
          {s.blocks.length ? <AllFields blocks={s.blocks} /> : null}
        </>
      ) : null}
      {r ? (
        <div className={styles.result}>
          <div className={styles.fileHead}>
            <strong>After cleaning</strong>
            <span className={styles.badge} data-verdict={r.after.verdict}>
              {VERDICT[r.after.verdict]}
            </span>
            <span className={styles.meta}>
              {size(item.file.size)} → {size(r.bytes.byteLength)}
            </span>
          </div>
          <ul className={styles.lines}>
            {r.removed.length ? <li>Removed: {r.removed.map((b) => b.label).join(", ")}</li> : null}
            {r.rewritten.length ? <li>Rewritten: {r.rewritten.map((b) => b.label).join(", ")}</li> : null}
            {r.after.orientation && r.after.orientation > 1 ? <li>Orientation kept</li> : null}
            <li data-state={r.imageSame ? "ok" : "warn"}>{r.imageSame ? "Image data unchanged (byte-identical, no re-encoding)" : "Image data changed. Please report this file."}</li>
            <li data-state={left.length ? "warn" : "ok"}>{left.length ? `Still found in the file: ${left.join(", ")}` : "Rescan: no AI metadata left"}</li>
            {r.before.privacy.length ? (
              <li data-state={keptPrivacy.length ? (mode === "ai-only" ? undefined : "warn") : "ok"}>
                {keptPrivacy.length ? `Still in the file: ${keptPrivacy.map((k) => PRIVACY_NAME[k]).join(", ")}` : "Rescan: no location, device, date or author data left"}
              </li>
            ) : null}
          </ul>
          <button type="button" className={styles.primary} onClick={() => onDownload(item)}>
            Download
          </button>
        </div>
      ) : null}
    </li>
  );
}

export function AiMetadataRemover({ variant }: { variant: Variant }) {
  const [items, setItems] = useState<Item[]>([]);
  const [mode, setMode] = useState<Mode>("all");
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [notice, setNotice] = useState("");
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef(new Map<number, (reply: WorkerReply) => void>());
  const seq = useRef(0);
  const itemsRef = useRef<Item[]>([]);

  useEffect(() => {
    const worker = new Worker(new URL("../../lib/free-tools/ai-metadata/worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<WorkerReply>) => {
      pending.current.get(e.data.id)?.(e.data);
      pending.current.delete(e.data.id);
    };
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  const call = useCallback((msg: Record<string, unknown>, bytes: ArrayBuffer) => {
    return new Promise<WorkerReply>((resolve) => {
      const id = ++seq.current;
      pending.current.set(id, resolve);
      workerRef.current!.postMessage({ ...msg, id, bytes }, [bytes]);
    });
  }, []);

  const update = useCallback((id: number, patch: Partial<Item>) => {
    itemsRef.current = itemsRef.current.map((it) => (it.id === id ? { ...it, ...patch } : it));
    setItems(itemsRef.current);
  }, []);

  const add = useCallback(
    async (files: File[]) => {
      const room = AI_METADATA_LIMITS.files - itemsRef.current.length;
      setNotice(files.length > room ? `Only the first ${AI_METADATA_LIMITS.files} files were added.` : "");
      const added = files.slice(0, Math.max(0, room)).map((file) => ({ id: ++seq.current, file }));
      itemsRef.current = [...itemsRef.current, ...added];
      setItems(itemsRef.current);
      for (const it of added) {
        if (it.file.size > AI_METADATA_LIMITS.mb * 1024 * 1024) {
          update(it.id, { error: `File is larger than ${AI_METADATA_LIMITS.mb} MB.` });
          continue;
        }
        const reply = await call({ type: "scan" }, await it.file.arrayBuffer());
        if (reply.ok) update(it.id, { scan: reply.scan });
        else update(it.id, { error: reply.unsupported ? "Not a supported image. Use JPG, PNG, WebP, HEIC or AVIF." : `Could not read this file: ${reply.error}` });
      }
    },
    [call, update],
  );

  const changeMode = (next: Mode) => {
    setMode(next);
    itemsRef.current = itemsRef.current.map((it) => ({ ...it, result: undefined }));
    setItems(itemsRef.current);
  };

  const cleanAll = async () => {
    if (busy) return;
    setBusy(true);
    for (const it of itemsRef.current) {
      if (!it.scan || it.result) continue;
      const reply = await call({ type: "clean", mode }, await it.file.arrayBuffer());
      if (reply.ok) update(it.id, { result: reply.result });
      else update(it.id, { error: `Could not read this file: ${reply.error}` });
    }
    setBusy(false);
  };

  // Analytics only on a download click, with coarse labels: never file names, sizes or contents.
  const downloadOne = (it: Item) => {
    if (!it.result) return;
    trackEvent("AI Metadata Download", { page: variant, format: it.scan!.format, verdict: it.scan!.verdict, signals: signalKinds([it]), mode });
    save(new Blob([it.result.bytes], { type: it.file.type || "application/octet-stream" }), outName(it));
  };

  const downloadZip = () => {
    const done = items.filter((it) => it.result);
    const files: Record<string, [Uint8Array, { level: 0 }]> = {};
    for (const it of done) {
      let name = outName(it);
      for (let k = 2; files[name]; k++) name = outName(it).replace(/(\.[^.]+)$/, `-${k}$1`);
      files[name] = [new Uint8Array(it.result!.bytes), { level: 0 }];
    }
    trackEvent("AI Metadata Download", { page: variant, format: [...new Set(done.map((it) => it.scan!.format))].sort().join(","), verdict: "batch", signals: signalKinds(done), mode, count: String(done.length) });
    save(new Blob([zipSync(files) as BlobPart], { type: "application/zip" }), variant === "label" ? "ai-label-removed.zip" : "ai-metadata-removed.zip");
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setOver(false);
    if (e.dataTransfer?.files) add([...e.dataTransfer.files]);
  };

  const ready = items.filter((it) => it.scan);
  const cleaned = items.filter((it) => it.result);

  return (
    <section className={styles.tool} id="tool" aria-label={variant === "label" ? "AI label remover" : "AI metadata remover"}>
      <div className={styles.modes} role="radiogroup" aria-label="What to remove">
        <label className={styles.mode}>
          <input type="radio" name="mode" value="all" checked={mode === "all"} onChange={() => changeMode("all")} />
          <span>
            <strong>Remove all metadata</strong>
            <small>Keeps orientation and color profile</small>
          </span>
        </label>
        <label className={styles.mode}>
          <input type="radio" name="mode" value="ai-only" checked={mode === "ai-only"} onChange={() => changeMode("ai-only")} />
          <span>
            <strong>Remove AI fields only</strong>
            <small>Keeps camera, date, GPS location and other ordinary fields</small>
          </span>
        </label>
      </div>
      <label
        className={styles.drop}
        data-over={over ? "true" : undefined}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif,.jpg,.jpeg,.png,.webp,.heic,.heif,.avif"
          onChange={(e) => {
            if (e.target.files) add([...e.target.files]);
            e.target.value = "";
          }}
        />
        <svg aria-hidden="true" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="m17 8-5-5-5 5" />
          <path d="M12 3v12" />
        </svg>
        <strong>Drop images here or choose files</strong>
        <small>
          JPG, PNG, WebP, HEIC, AVIF · up to {AI_METADATA_LIMITS.files} files · {AI_METADATA_LIMITS.mb} MB each · files never leave your device
        </small>
      </label>
      {notice ? <p className={styles.notice}>{notice}</p> : null}
      {items.length ? (
        <div className={styles.actions}>
          <button type="button" className={styles.primary} disabled={busy || !ready.some((it) => !it.result)} onClick={cleanAll}>
            {busy ? "Cleaning…" : CLEAN_LABEL[variant]}
          </button>
          {cleaned.length >= 2 ? (
            <button type="button" className={styles.secondary} onClick={downloadZip}>
              Download all (ZIP)
            </button>
          ) : null}
          <button
            type="button"
            className={styles.ghost}
            onClick={() => {
              itemsRef.current = [];
              setItems([]);
              setNotice("");
            }}
          >
            Clear
          </button>
        </div>
      ) : null}
      {items.length ? (
        <ul className={styles.files}>
          {items.map((it) => (
            <FileCard key={it.id} item={it} variant={variant} mode={mode} onDownload={downloadOne} />
          ))}
        </ul>
      ) : null}
      <p className={styles.limits}>Removes metadata only. Invisible watermarks such as Google SynthID, and visual AI detection, are not affected.</p>
    </section>
  );
}
