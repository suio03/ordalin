export function Checked({ on, children }: { on: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 font-mono text-[13px] text-muted-2 md:items-end">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-ok" />
        Checked {on}
      </div>
      {children}
    </div>
  );
}
