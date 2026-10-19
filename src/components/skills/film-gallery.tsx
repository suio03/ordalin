"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { GalleryItem } from "@/lib/skills/types";

/** Consecutive items with the same `group` share one heading. */
function groupItems(items: GalleryItem[]) {
  const groups: { name?: string; items: GalleryItem[] }[] = [];
  for (const item of items) {
    const last = groups.at(-1);
    if (last && last.name === item.group) last.items.push(item);
    else groups.push({ name: item.group, items: [item] });
  }
  return groups;
}

/**
 * A skill author's demo films. Items with a `video` open the author's hosted
 * film in a native modal dialog.
 */
export function FilmGallery({ items }: { items: GalleryItem[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState<GalleryItem | null>(null);

  function open(item: GalleryItem) {
    setPlaying(item);
    dialogRef.current?.showModal();
  }

  function close() {
    videoRef.current?.pause();
    setPlaying(null);
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        {groupItems(items).map((group) => (
          <div key={group.name ?? group.items[0].src} className="flex flex-col gap-4">
            {group.name && (
              <h3 className="text-[13px] font-bold tracking-[0.06em] text-muted uppercase">
                {group.name} <span className="font-normal">· {group.items.length}</span>
              </h3>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <figure key={item.src} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
                  <div className="relative">
                    <Image src={item.src} unoptimized alt={`${item.label} style: ${item.title}`} width={800} height={450} loading="lazy" className="aspect-video h-auto w-full object-cover" />
                    {item.video && (
                      <button
                        type="button"
                        onClick={() => open(item)}
                        aria-label={`Play ${item.title}`}
                        className="absolute inset-0 flex cursor-pointer items-end justify-start p-3"
                      >
                        <span className="flex items-center gap-2 rounded-full bg-black/70 py-1.5 pr-3 pl-2.5 font-mono text-[13px] text-white">
                          <svg viewBox="0 0 12 12" aria-hidden="true" className="h-3 w-3 fill-current">
                            <path d="M2.5 1.5v9l8-4.5z" />
                          </svg>
                          {item.duration}
                        </span>
                      </button>
                    )}
                  </div>
                  <figcaption className="flex flex-col gap-2 p-4">
                    <span className="font-bold">{item.label}</span>
                    <span className="text-[14px] text-muted">
                      <i>{item.title}</i>. {item.caption}
                    </span>
                    {item.uses && (
                      <ul className="flex flex-wrap gap-1.5" aria-label="Suits">
                        {item.uses.map((use) => (
                          <li key={use} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[12px] text-muted-2">
                            {use}
                          </li>
                        ))}
                      </ul>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        onClose={close}
        onClick={(event) => event.target === dialogRef.current && dialogRef.current.close()}
        className="m-auto w-[min(1100px,calc(100vw-32px))] rounded-2xl bg-transparent p-0 backdrop:bg-black/90"
      >
        {playing && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4 text-white">
              <span className="font-bold">
                {playing.label} · <i className="font-normal">{playing.title}</i>
              </span>
              <button type="button" onClick={() => dialogRef.current?.close()} className="cursor-pointer rounded-full bg-white/15 px-3 py-1 text-[14px]">
                Close
              </button>
            </div>
            <video ref={videoRef} src={playing.video} poster={playing.src} controls autoPlay playsInline className="aspect-video w-full rounded-xl bg-black" />
          </div>
        )}
      </dialog>
    </>
  );
}
