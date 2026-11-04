"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import styles from "./site-shell.module.css";

type MenuItem = { href: string; label: string; note?: string };

/**
 * A primary-navigation group that opens a short list, so related hubs share one
 * header slot. A native disclosure works without JavaScript; the client part
 * closes it after navigation, on Escape and on a click outside.
 */
export function NavMenu({ label, items }: { label: string; items: MenuItem[] }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDetailsElement>(null);
  const active = items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  useEffect(() => {
    function close(event: Event) {
      const details = ref.current;
      if (!details?.open) return;
      if (event instanceof KeyboardEvent) {
        if (event.key !== "Escape") return;
        details.open = false;
        details.querySelector("summary")?.focus();
      } else if (!details.contains(event.target as Node)) {
        details.open = false;
      }
    }
    document.addEventListener("keydown", close);
    document.addEventListener("click", close);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("click", close);
    };
  }, []);

  return (
    <details className={styles.navMenu} ref={ref}>
      <summary aria-current={active ? "true" : undefined}>
        {label}
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M3 4.5 6 7.5 9 4.5" />
        </svg>
      </summary>
      <div className={styles.navMenuPanel}>
        {items.map((item) => (
          <Link href={item.href} key={item.href} aria-current={pathname === item.href ? "page" : undefined}>
            <span>{item.label}</span>
            {item.note ? <small>{item.note}</small> : null}
          </Link>
        ))}
      </div>
    </details>
  );
}
