import { notFound } from "next/navigation";
import { RootDocument, rootMetadata } from "@/components/root-document";
import { extraLocales, isExtraLocale } from "@/lib/free-tools/i18n";
import "../../globals.css";

// Root layout for localized free tools (/ja/…, /es/…, /id/…), so <html lang>
// matches the page. Everything else on Ordalin uses app/(site)/layout.tsx.
export const metadata = rootMetadata;
export { viewport } from "@/components/root-document";

export const generateStaticParams = () => extraLocales.map((locale) => ({ locale }));

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isExtraLocale(locale)) notFound();
  return <RootDocument lang={locale}>{children}</RootDocument>;
}
