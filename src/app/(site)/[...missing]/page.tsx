import { notFound } from "next/navigation";

// With two root layouts ((site) and (i18n)/[locale]) there is no top-level
// layout, so unmatched URLs would get Next's bare 404. Catch them here so the
// 404 renders inside the site layout with its header and theme.
export default function Missing() {
  notFound();
}
