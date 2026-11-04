import Image from "next/image";
import Link from "next/link";
import { indexableCategoryMinimum } from "@/lib/catalog";
import { editorialHref, listEditorialPages } from "@/lib/editorial";
import { listPublishedGuides } from "@/lib/guides";
import { listBrowseCategories, listCategories, listCollections, listTasks } from "@/lib/repositories/catalog";
import { getServer, mcpPath, publishedServerSlugs, visibleServerSlugs } from "@/lib/mcp/data";
import { displayName as skillName, getSkill, publishedSkillSlugs, skillsPath, visibleSkillSlugs } from "@/lib/skills/data";
import HomePartners from "./home-partners";
import { MobileMenu } from "./mobile-menu";
import { NavMenu } from "./nav-menu";
import { ThemeSelector } from "./theme-selector";
import styles from "./site-shell.module.css";

// Agent-side hubs share one header slot. Skills and MCP appear once a page is visible.
function agentNavigation() {
  return [
    { href: "/agents", label: "AI agents", note: "Agents compared on price, platforms and privacy" },
    { href: "/models", label: "AI models", note: "Models with prices and limits" },
    ...(visibleSkillSlugs().length ? [{ href: skillsPath.overview, label: "Agent skills", note: "Skills we installed and tested" }] : []),
    ...(visibleServerSlugs().length ? [{ href: mcpPath.overview, label: "MCP servers", note: "Servers we connected and tested" }] : []),
  ];
}

// Editorial hubs appear only once they have something to show.
function primaryNavigation() {
  return {
    before: [
      { href: "/tools", label: "All tools" },
      ...(listEditorialPages("best").length ? [{ href: "/best", label: "Best of" }] : []),
      ...(listEditorialPages("compare").length ? [{ href: "/compare", label: "Compare" }] : []),
      { href: "/guides", label: "Guides" },
    ],
    agents: agentNavigation(),
    after: [
      { href: "/tasks", label: "Find by goal" },
      { href: "/collections", label: "Collections" },
    ],
  };
}

export function SiteHeader() {
  const { before, agents, after } = primaryNavigation();
  const link = (item: { href: string; label: string }) => (
    <Link href={item.href} key={item.href}>
      {item.label}
    </Link>
  );
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
        {before.map(link)}
        <NavMenu label="Agents" items={agents} />
        {after.map(link)}
      </nav>
      <ThemeSelector />
      <Link className={styles.submit} href="/submit">
        Submit a tool
      </Link>
      <MobileMenu items={[...before, ...agents.map(({ href, label }) => ({ href, label })), ...after]} />
    </header>
  );
}

type FooterColumn = { title: string; links: Array<{ href: string; label: string }> };

// Footer directory: links every indexable listing page so crawlers reach each one
// within two clicks of any page. Categories below indexableCategoryMinimum are noindex.
async function directoryColumns(): Promise<FooterColumn[]> {
  const [groups, categories, tasks, collections] = await Promise.all([
    listCategories(),
    listBrowseCategories(),
    listTasks(),
    listCollections(),
  ]).catch(() => [[], [], [], []] as const);
  const skills = publishedSkillSlugs();
  const servers = publishedServerSlugs();
  const guides = await listPublishedGuides().catch(() => []);
  return [
    {
      title: "Categories",
      links: groups
        .filter((group) => group.publishedToolCount >= indexableCategoryMinimum)
        .map((group) => ({ href: `/categories/${group.slug}`, label: group.name })),
    },
    {
      title: "Popular categories",
      links: categories
        .filter((category) => category.publishedToolCount >= indexableCategoryMinimum)
        .map((category) => ({ href: `/categories/${category.groupSlug}/${category.slug}`, label: category.name })),
    },
    {
      title: "Find by goal",
      links: tasks.map((task) => ({ href: `/tasks/${task.slug}`, label: task.name })),
    },
    {
      title: "Collections",
      links: collections.map((collection) => ({ href: `/collections/${collection.slug}`, label: collection.name })),
    },
    {
      title: "Agent skills",
      links: skills.map((slug) => ({ href: skillsPath.skill(slug), label: skillName(getSkill(slug)) })),
    },
    {
      title: "MCP servers",
      links: servers.map((slug) => ({ href: mcpPath.server(slug), label: getServer(slug).name })),
    },
    {
      // Newest first, from listPublishedGuides().
      title: "Guides",
      links: [...guides.map((guide) => ({ href: `/guides/${guide.slug}`, label: guide.title })), { href: "/guides", label: "All guides" }],
    },
  ].filter((column) => column.links.length);
}

function FooterColumns({ columns, className }: { columns: FooterColumn[]; className?: string }) {
  return (
    <div className={className ? `${styles.footerColumns} ${className}` : styles.footerColumns}>
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
  );
}

export async function SiteFooter() {
  const directory = await directoryColumns();
  const bestPages = listEditorialPages("best");
  const comparePages = listEditorialPages("compare");
  const alternativesPages = listEditorialPages("alternatives");
  const columns: FooterColumn[] = [
    {
      title: "Browse",
      links: [
        { href: "/tools", label: "All tools" },
        { href: "/tools/a-z", label: "All tools A–Z" },
        { href: "/agents", label: "AI agents" },
        { href: "/models", label: "AI models" },
        { href: "/tasks", label: "Find by goal" },
        { href: "/collections", label: "Collections" },
        ...(visibleSkillSlugs().length ? [{ href: skillsPath.overview, label: "Agent skills" }] : []),
        ...(visibleServerSlugs().length ? [{ href: mcpPath.overview, label: "MCP servers" }] : []),
        { href: "/guides", label: "Guides" },
        { href: "/search", label: "Advanced search" },
      ],
    },
    ...(bestPages.length ? [{
      title: "Best of",
      links: [...bestPages.map((page) => ({ href: editorialHref(page), label: page.title })), { href: "/best", label: "All best-of lists" }],
    }] : []),
    ...(comparePages.length ? [{
      title: "Compare",
      links: [...comparePages.map((page) => ({ href: editorialHref(page), label: page.title })), { href: "/compare", label: "All comparisons" }],
    }] : []),
    ...(alternativesPages.length ? [{
      title: "Alternatives",
      links: [...alternativesPages.map((page) => ({ href: editorialHref(page), label: page.title })), { href: "/alternatives", label: "All alternatives" }],
    }] : []),
    {
      title: "Ordalin",
      links: [
        { href: "/about/how-we-review", label: "How we review" },
        { href: "/submit", label: "Submit a tool" },
        { href: "/free-tools/ai-visibility-checker", label: "AI visibility checker" },
        { href: "/free-tools/llms-txt-generator", label: "llms.txt generator" },
        { href: "/free-tools/llms-txt-checker", label: "llms.txt checker" },
        { href: "/free-tools/og-image-checker", label: "OG image checker" },
        { href: "https://github.com/suio03/ordalin", label: "GitHub" },
      ],
    },
  ];
  return (
    <footer className={styles.footer}>
      <FooterColumns columns={columns} />
      {directory.length ? <FooterColumns columns={directory} className={styles.footerDirectory} /> : null}
      <HomePartners />
      <span>Ordalin · Ordered discovery for AI tools · No paid placement</span>
    </footer>
  );
}
