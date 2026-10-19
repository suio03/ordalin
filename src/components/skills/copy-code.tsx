"use client";

import { useState } from "react";

/** A command or request shown verbatim, with a button that copies it. */
export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-start gap-3 rounded-xl bg-surface-2 p-3 pl-4">
      <pre className="min-w-0 flex-1 font-mono text-[14px] leading-[1.6] break-words whitespace-pre-wrap">{code}</pre>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1_500);
          });
        }}
        className="shrink-0 cursor-pointer rounded-full border border-line bg-surface px-3 py-1 text-[13px] font-bold"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
