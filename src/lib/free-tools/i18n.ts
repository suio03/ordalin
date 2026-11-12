// Multilingual free tools (docs/i18n/README.md). English is unprefixed; other
// locales live under /{locale}/free-tools/… and only for the pages listed in
// `toolLocales`. Every other Ordalin page stays English only.

export const extraLocales = ["ja", "es", "id"] as const;
export type ExtraLocale = (typeof extraLocales)[number];
export type Locale = "en" | ExtraLocale;

export const localeInfo: Record<Locale, { name: string; og: string }> = {
  en: { name: "English", og: "en_US" },
  ja: { name: "日本語", og: "ja_JP" },
  es: { name: "Español", og: "es_ES" },
  id: { name: "Bahasa Indonesia", og: "id_ID" },
};

/** Locales each localized free tool is published in. English is always included. */
export const toolLocales: Record<string, Locale[]> = {
  "circle-crop-image": ["en", "ja", "es", "id"],
  "square-an-image": ["en", "ja"],
};

export const isExtraLocale = (value: string): value is ExtraLocale =>
  (extraLocales as readonly string[]).includes(value);

export const localizePath = (path: string, locale: Locale) =>
  locale === "en" ? path : `/${locale}${path === "/" ? "" : path}`;

export const localesFor = (slug: string): Locale[] => toolLocales[slug] ?? ["en"];

/** Locales that have at least one localized tool (for the localized hubs). */
export const hubLocales = (locale: Locale) =>
  Object.values(toolLocales).some((locales) => locales.includes(locale));

/** hreflang map for Next metadata: every published locale plus x-default (English). */
export function languageAlternates(path: string, locales: Locale[]) {
  const languages: Record<string, string> = {};
  for (const locale of locales) languages[locale] = localizePath(path, locale);
  languages["x-default"] = path;
  return languages;
}
