import type { ReactNode } from "react";

export type SpecRow = { label: string; cells: ReactNode[]; mono?: boolean };

/** Official-facts table. Columns: one per agent; colours follow design v0.1 (left blue, right orange). */
export function SpecTable({ heads, rows, footnote }: { heads: { name: string; color: string; initial: string }[]; rows: SpecRow[]; footnote?: string }) {
  const cols = `minmax(120px,200px) repeat(${heads.length}, minmax(0,1fr))`;
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <div className="min-w-[560px]">
          <div className="grid border-b border-line bg-surface-2" style={{ gridTemplateColumns: cols }}>
            <div className="px-5 py-4" />
            {heads.map((h) => (
              <div key={h.name} className="flex items-center gap-2.5 px-5 py-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-[9px] font-extrabold text-white" style={{ background: h.color }}>
                  {h.initial}
                </span>
                <span className="text-[17px] font-bold">{h.name}</span>
              </div>
            ))}
          </div>
          {rows.map((row) => (
            <div key={row.label} className="grid border-b border-line-soft text-[15px] last:border-b-0 md:text-[16px]" style={{ gridTemplateColumns: cols }}>
              <div className="px-5 py-4 font-semibold text-muted-2">{row.label}</div>
              {row.cells.map((cell, i) => (
                <div key={i} className={`px-5 py-4 ${row.mono ? "font-mono" : ""}`}>
                  {cell}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {footnote && <p className="text-[13px] text-muted">{footnote}</p>}
    </div>
  );
}
