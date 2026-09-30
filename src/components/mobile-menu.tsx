"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import styles from "./site-shell.module.css";

type MenuItem = { href: string; label: string };

/**
 * Compact-width primary navigation. A native disclosure works without
 * JavaScript; the client part only closes it after in-app navigation.
 */
export function MobileMenu({ items }: { items: MenuItem[] }) {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const details = detailsRef.current;
      if (event.key !== "Escape" || !details?.open) return;
      details.open = false;
      details.querySelector("summary")?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <details className={styles.mobileMenu} ref={detailsRef}>
      <summary aria-label="Menu">
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3 6h14M3 10h14M3 14h14" />
        </svg>
      </summary>
      <nav className={styles.mobileMenuPanel} aria-label="Primary navigation">
        {items.map((item) => (
          <Link
            href={item.href}
            key={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </details>
  );
}
