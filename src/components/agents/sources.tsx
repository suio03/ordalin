import { hostOf } from "@/lib/agents/data";

export function Sources({ title = "Sources", urls }: { title?: string; urls: string[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-[26px] font-medium">{title}</h2>
      <ol className="flex flex-col gap-1.5 text-[15px]">
        {urls.map((url) => (
          <li key={url} className="flex gap-2">
            <span className="font-mono text-muted">{hostOf(url)}</span>
            <a href={url} rel="noopener" className="break-all">
              {url.replace(/^https?:\/\//, "")} ↗
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
