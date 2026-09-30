import { JsonLd } from "./json-ld";

export type FaqItem = { q: string; a: string };

export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <section id="faq" className="flex flex-col gap-4">
      <h2 className="font-serif text-[30px] font-medium md:text-[36px]">FAQ</h2>
      <div className="rounded-2xl border border-line bg-surface">
        {items.map((item, i) => (
          <details key={item.q} open={i === 0} className="border-b border-line-soft px-6 py-5 last:border-b-0">
            <summary className="cursor-pointer text-[18px] font-bold">{item.q}</summary>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{item.a}</p>
          </details>
        ))}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
        }}
      />
    </section>
  );
}
