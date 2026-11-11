import type { ReactNode } from "react";
import { CopyCode } from "@/components/skills/copy-code";
import type { HowItWorksPart, QuickstartStep, TestRun, TestSample, TestShot } from "@/lib/skills/types";

// Shared building blocks of the /skills and /mcp detail pages: result cards, pictures of the
// output, numbered steps and samples, so a reader can see the outcome before reading prose.

export const sectionHeading = "font-serif text-[30px] font-medium md:text-[36px]";

/** One card per test run: what it produced, then time, cost and turns. */
export function TestRuns({ runs }: { runs: TestRun[] }) {
  return (
    <div className={`grid gap-4 ${runs.length > 1 ? "md:grid-cols-2" : ""}`}>
      {runs.map((run) => (
        <div key={run.label} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-bold tracking-[0.06em] text-muted uppercase">{run.label}</span>
            <span className="flex items-start gap-2 text-[17px] leading-snug font-bold">
              {run.tone === "ok" && <span aria-hidden className="mt-[7px] size-2 shrink-0 rounded-full bg-ok" />}
              {run.outcome}
            </span>
          </div>
          <dl className="grid grid-cols-3 gap-2">
            {(
              [
                ["Time", run.time],
                ["Cost", run.cost],
                ["Turns", String(run.turns)],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="rounded-xl bg-surface-2 px-3 py-2">
                <dt className="text-[12px] text-muted">{label}</dt>
                <dd className="font-mono text-[18px] font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

/** Pictures of what the runs produced, side by side on wide screens. */
export function TestShots({ shots }: { shots: TestShot[] }) {
  return (
    <div className={`grid items-start gap-4 ${shots.length > 1 ? "md:grid-cols-2" : ""}`}>
      {shots.map((shot) => (
        <figure key={shot.src} className="flex flex-col gap-2">
          <div className="flex aspect-[16/10] items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-card">
            {shot.video ? (
              <video src={shot.video} poster={shot.src} aria-label={shot.alt} width={shot.width} height={shot.height} controls playsInline preload="none" className="block max-h-full w-auto max-w-full object-contain" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- static files from public/, sized by width and height
              <img src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} loading="lazy" className="block max-h-full w-auto max-w-full object-contain" />
            )}
          </div>
          <figcaption className="text-[14px] text-muted-2">{shot.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}

/** Best for and Not the best fit for, side by side. */
export function FitCards({ bestFor, notFor }: { bestFor: string[]; notFor: string[] }) {
  const list = (items: string[], mark: string) => (
    <ul className="flex flex-col gap-3 text-[16px] leading-snug">
      {items.map((x) => (
        <li key={x} className="flex gap-3">
          <span aria-hidden className="w-4 shrink-0 font-bold text-muted">
            {mark}
          </span>
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
        <h2 className="mb-4 text-[13px] font-bold tracking-[0.06em] text-ok uppercase">Best for</h2>
        {list(bestFor, "+")}
      </div>
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
        <h2 className="mb-4 text-[13px] font-bold tracking-[0.06em] text-muted uppercase">Not the best fit for</h2>
        {list(notFor, "–")}
      </div>
    </section>
  );
}

/** How it works as numbered cards. */
export function HowItWorks({ parts }: { parts: HowItWorksPart[] }) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className={sectionHeading}>How it works</h2>
      <ol className="grid gap-4 md:grid-cols-2">
        {parts.map((part, i) => (
          <li key={part.title} className="flex gap-4 rounded-2xl border border-line bg-surface p-6 shadow-card">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-[14px] font-bold">{i + 1}</span>
            <div>
              <h3 className="mb-2 font-bold">{part.title}</h3>
              <p className="text-[15px] leading-relaxed text-muted-2">{part.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Copyable steps, numbered along a line. */
export function Steps({ heading, steps }: { heading: string; steps: QuickstartStep[] }) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className={sectionHeading}>{heading}</h2>
      <ol className="flex flex-col">
        {steps.map((step, i) => (
          <li key={step.label} className="relative flex gap-4 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface font-mono text-[14px] font-bold">{i + 1}</span>
              {i < steps.length - 1 && <span aria-hidden className="mt-2 w-px flex-1 bg-[var(--color-border-subtle)]" />}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
              <span className="font-bold">{step.label}</span>
              <CopyCode code={step.code} />
              {step.note && <p className="text-[14px] text-muted">{step.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** A long reference block, closed until the reader opens it. */
export function Collapsible({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <details className="group rounded-2xl border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-bold [&::-webkit-details-marker]:hidden">
        <span>
          {title}
          {count !== undefined && <span className="ml-2 font-mono text-[14px] font-normal text-muted">{count}</span>}
        </span>
        <span aria-hidden className="text-muted transition-transform group-open:rotate-90">
          ›
        </span>
      </summary>
      <div className="border-t border-line-soft">{children}</div>
    </details>
  );
}

/** One verbatim sample from the test; tool calls and terminal output keep their lines. */
export function SampleCard({ sample, mono }: { sample: TestSample; mono?: boolean }) {
  return (
    <figure className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-card">
      <figcaption className="flex flex-col gap-1">
        <span className="font-bold">{sample.label}</span>
        {sample.note && <span className="text-[14px] leading-snug text-muted-2">{sample.note}</span>}
      </figcaption>
      {mono || sample.mono ? (
        <pre className="overflow-x-auto rounded-xl bg-surface-2 p-4 font-mono text-[13px] leading-[1.6]">{sample.text}</pre>
      ) : (
        <p className="text-[15px] leading-relaxed whitespace-pre-line">{sample.text}</p>
      )}
    </figure>
  );
}
