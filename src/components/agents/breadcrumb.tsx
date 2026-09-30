import Link from "next/link";
import { absoluteUrl } from "@/lib/agents/site";
import { JsonLd } from "./json-ld";

export function Breadcrumb({ items }: { items: { href: string; label: string }[] }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-[14px] text-muted">
        {items.map((item, i) =>
          i === items.length - 1 ? (
            <span key={item.href} className="text-ink">{item.label}</span>
          ) : (
            <span key={item.href} className="flex gap-2">
              <Link href={item.href} className="text-muted">{item.label}</Link>
              <span>/</span>
            </span>
          ),
        )}
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.label, item: absoluteUrl(item.href) })),
        }}
      />
    </>
  );
}
