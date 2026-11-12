import type { Metadata } from "next";
import { freeToolPath } from "@/lib/free-tools/registry";
import { languageAlternates, localeInfo, localesFor, localizePath, type Locale } from "@/lib/free-tools/i18n";
import { withSocial } from "@/lib/seo";
import { circlePageEn } from "./circle-page.en";
import { circlePageEs } from "./circle-page.es";
import { circlePageId } from "./circle-page.id";
import { circlePageJa } from "./circle-page.ja";
import type { ToolPageCopy } from "./page-copy";
import { squarePageEn } from "./square-page.en";
import { squarePageJa } from "./square-page.ja";

export type ShapeSlug = "circle-crop-image" | "square-an-image";

/** Page copy per locale. A locale listed in i18n `toolLocales` must have copy here. */
export const shapePages: Record<
  ShapeSlug,
  { name: string; localNames: Partial<Record<Locale, string>>; copy: Partial<Record<Locale, ToolPageCopy>> }
> = {
  "circle-crop-image": {
    name: "Circle Crop Image",
    localNames: { ja: "画像を丸く切り抜く", es: "Recortar imagen en círculo", id: "Crop Foto Bulat" },
    copy: { en: circlePageEn, ja: circlePageJa, es: circlePageEs, id: circlePageId },
  },
  "square-an-image": {
    name: "Square an Image",
    localNames: { ja: "画像を正方形にする" },
    copy: { en: squarePageEn, ja: squarePageJa },
  },
};

/** Tool name in the page's language, for JSON-LD. */
export function shapeName(slug: ShapeSlug, locale: Locale): string {
  return shapePages[slug].localNames[locale] ?? shapePages[slug].name;
}

export function shapeCopy(slug: ShapeSlug, locale: Locale): ToolPageCopy {
  const copy = shapePages[slug].copy[locale];
  if (!copy) throw new Error(`No ${locale} copy for ${slug}`);
  return copy;
}

export function shapeMetadata(slug: ShapeSlug, locale: Locale): Metadata {
  const path = freeToolPath(slug);
  const copy = shapeCopy(slug, locale);
  return withSocial({
    alternates: { canonical: localizePath(path, locale), languages: languageAlternates(path, localesFor(slug)) },
    title: { absolute: copy.title },
    description: copy.description,
    openGraph: { locale: localeInfo[locale].og },
  });
}

/** Localized hub (/{locale}/free-tools) strings. Only locales with two or more tools get a hub. */
export const localizedHubs: Partial<Record<Locale, { title: string; description: string; home: string; h1: string; intro: string; tools: Partial<Record<ShapeSlug, { name: string; summary: string }>> }>> = {
  ja: {
    title: "無料ツール（画像） | Ordalin",
    home: "ホーム",
    description: "画像を丸く切り抜く、画像を正方形にする。Ordalin の無料画像ツールはブラウザ内で動き、アップロードも登録も不要です。",
    h1: "無料の画像ツール",
    intro: "どのツールも無料で、登録はいりません。画像はブラウザの中で処理され、アップロードされません。",
    tools: {
      "circle-crop-image": { name: "画像を丸く切り抜く", summary: "画像を円形に切り抜き、角が透明なPNGで保存" },
      "square-an-image": { name: "画像を正方形にする", summary: "切り取らずに余白を足すか、1:1 で切り抜いて正方形に" },
    },
  },
};
