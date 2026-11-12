import { notFound } from "next/navigation";
import { SquareImageTool } from "@/components/free-tools/image-shape/square-image-tool";
import { ToolPage } from "@/components/free-tools/image-shape/tool-page";
import { isExtraLocale, localesFor } from "@/lib/free-tools/i18n";
import { shapeCopy, shapeMetadata, shapeName } from "@/lib/free-tools/image-shape/pages";
import { uiCopy } from "@/lib/free-tools/image-shape/ui-copy";
import { freeToolPath } from "@/lib/free-tools/registry";

const SLUG = "square-an-image";
type Props = { params: Promise<{ locale: string }> };

// Only the locales listed for this tool in i18n toolLocales; the rest 404.
export const dynamicParams = false;
export const generateStaticParams = () => localesFor(SLUG).filter(isExtraLocale).map((locale) => ({ locale }));

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isExtraLocale(locale) || !localesFor(SLUG).includes(locale)) return {};
  return shapeMetadata(SLUG, locale);
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (!isExtraLocale(locale) || !localesFor(SLUG).includes(locale)) notFound();
  return (
    <ToolPage
      copy={shapeCopy(SLUG, locale)}
      path={freeToolPath(SLUG)}
      name={shapeName(SLUG, locale)}
      tool={<SquareImageTool t={uiCopy[locale]} />}
      locale={locale}
      locales={localesFor(SLUG)}
    />
  );
}
