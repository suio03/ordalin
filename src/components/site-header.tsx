import Image from "next/image";
import Link from "next/link";
import { editorialHref, listEditorialPages } from "@/lib/editorial";
import { MobileMenu } from "./mobile-menu";
import { ThemeSelector } from "./theme-selector";
import styles from "./site-shell.module.css";

// Editorial hubs appear only once they have something to show.
function primaryNavigation() {
  return [
    { href: "/tools", label: "All tools" },
    ...(listEditorialPages("best").length ? [{ href: "/best", label: "Best of" }] : []),
    ...(listEditorialPages("compare").length ? [{ href: "/compare", label: "Compare" }] : []),
    { href: "/tasks", label: "Find by goal" },
    { href: "/collections", label: "Collections" },
  ];
}

export function SiteHeader() {
  const navigation = primaryNavigation();
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
      <MobileMenu items={navigation} />
    </header>
  );
}

export function SiteFooter() {
  const bestPages = listEditorialPages("best").slice(0, 5);
  const comparePages = listEditorialPages("compare").slice(0, 5);
  const alternativesPages = listEditorialPages("alternatives").slice(0, 5);
  const columns = [
    {
      title: "Browse",
      links: [
        { href: "/tools", label: "All tools" },
        { href: "/tasks", label: "Find by goal" },
        { href: "/collections", label: "Collections" },
        { href: "/search", label: "Advanced search" },
      ],
    },
    ...(bestPages.length ? [{
      title: "Best of",
      links: [...bestPages.map((page) => ({ href: editorialHref(page), label: page.title })), { href: "/best", label: "All best-of lists" }],
    }] : []),
    ...(comparePages.length || alternativesPages.length ? [{
      title: "Compare",
      links: [
        ...comparePages.map((page) => ({ href: editorialHref(page), label: page.title })),
        ...alternativesPages.map((page) => ({ href: editorialHref(page), label: page.title })),
        ...(comparePages.length ? [{ href: "/compare", label: "All comparisons" }] : []),
        ...(alternativesPages.length ? [{ href: "/alternatives", label: "All alternatives" }] : []),
      ],
    }] : []),
    {
      title: "Ordalin",
      links: [
        { href: "/about/how-we-review", label: "How we review" },
        { href: "/submit", label: "Submit a tool" },
        { href: "https://github.com/suio03/ordalin", label: "GitHub" },
      ],
    },
  ];
  return (
    <footer className={styles.footer}>
      <div className={styles.footerColumns}>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p>{column.title}</p>
            <ul>
              {column.links.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("/")
                    ? <Link href={link.href}>{link.label}</Link>
                    : <a href={link.href}>{link.label}</a>}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <span>Ordalin · Ordered discovery for AI tools · No paid placement</span>
    </footer>
  );
}
