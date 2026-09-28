import Image from "next/image";
import Link from "next/link";
import { ThemeSelector } from "./theme-selector";
import styles from "./site-shell.module.css";

const navigation = [
  { href: "/tasks", label: "Find by goal" },
  { href: "/collections", label: "Collections" },
  { href: "/search", label: "Search" },
] as const;

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="Ordalin home">
        <Image
          src="/brand/ordalin-logo-primary.svg"
          alt="Ordalin"
          width={720}
          height={220}
          priority
        />
      </Link>
      <nav className={styles.navigation} aria-label="Primary navigation">
        {navigation.map((item) => (
          <Link href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
      <ThemeSelector />
      <Link className={styles.submit} href="/submit">
        Submit a tool
      </Link>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <span>Ordalin · Ordered discovery for AI tools</span>
      <span>
        <Link href="/tasks">Find by goal</Link>
        <span aria-hidden="true"> · </span>
        <Link href="/submit">Submit</Link>
      </span>
    </footer>
  );
}
