// Prints the rendered robots, canonical, Open Graph and Twitter tags for one
// page per route type and fails when a page lacks share tags or its og:url
// differs from its canonical. Read-only: it only sends GET requests.
//
//   pnpm seo:check                          # http://localhost:3000
//   pnpm seo:check https://ordalin.com      # live
//   pnpm seo:check http://localhost:8790 /tools/adant /best
const defaultPaths = [
  "/", "/tools", "/tools?page=2", "/tools/granola", "/tools/adant",
  "/tasks", "/collections", "/categories/video", "/submit",
  "/about/how-we-review", "/search", "/best", "/alternatives", "/compare",
  "/guides", "/agents", "/agents/meta-muse", "/agents/methodology",
];
const [base = "http://localhost:3000", ...args] = process.argv.slice(2);
const paths = args.length ? args : defaultPaths;

const entities = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", "#x27": "'" };
const decode = (value) => value?.replace(/&(amp|lt|gt|quot|#39|#x27);/g, (_, name) => entities[name]);
const tag = (html, pattern) => decode(html.match(pattern)?.[1]);
const meta = (html, attribute, name) =>
  tag(html, new RegExp(`<meta ${attribute}="${name}" content="([^"]*)"`));

let failures = 0;
for (const path of paths) {
  const response = await fetch(new URL(path, base), { redirect: "manual" });
  const html = await response.text();
  const page = {
    robots: meta(html, "name", "robots") ?? "(default index)",
    canonical: tag(html, /<link rel="canonical" href="([^"]*)"/),
    ogTitle: meta(html, "property", "og:title"),
    ogUrl: meta(html, "property", "og:url"),
    ogImage: meta(html, "property", "og:image"),
    ogSize: [meta(html, "property", "og:image:width"), meta(html, "property", "og:image:height")].join(" × "),
    twitterCard: meta(html, "name", "twitter:card"),
    twitterTitle: meta(html, "name", "twitter:title"),
  };
  const problems = [];
  if (response.status !== 200) problems.push(`HTTP ${response.status}`);
  if (!page.ogTitle || !page.ogImage || !page.twitterCard || !page.twitterTitle) problems.push("missing share tags");
  if (page.canonical && page.ogUrl !== page.canonical) problems.push("og:url differs from canonical");
  if (problems.length) failures += 1;

  console.log(`${problems.length ? "FAIL" : "ok  "} ${path}${problems.length ? `  (${problems.join("; ")})` : ""}`);
  console.log(`     robots: ${page.robots}  canonical: ${page.canonical ?? "-"}`);
  console.log(`     og: "${page.ogTitle ?? "-"}"  ${page.ogImage ?? "-"} (${page.ogSize})`);
  console.log(`     twitter: ${page.twitterCard ?? "-"} "${page.twitterTitle ?? "-"}"`);
}
process.exitCode = failures ? 1 : 0;
