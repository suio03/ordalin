import type { Metadata } from "next";
import { freeToolPath, freeToolsHubPath } from "@/lib/free-tools/registry";
import { languageAlternates, localeInfo, localesFor, localizePath, type Locale } from "@/lib/free-tools/i18n";
import { withSocial } from "@/lib/seo";
import { circlePageEn } from "./circle-page.en";
import { circlePageEs } from "./circle-page.es";
import { circlePageId } from "./circle-page.id";
import { circlePageJa } from "./circle-page.ja";
import { flipPageEn } from "@/lib/free-tools/flip-image/page.en";
import { flipPageEs } from "@/lib/free-tools/flip-image/page.es";
import { flipPageId } from "@/lib/free-tools/flip-image/page.id";
import { flipPageJa } from "@/lib/free-tools/flip-image/page.ja";
import { mirrorPageEn } from "@/lib/free-tools/mirror-image/page.en";
import type { ToolPageCopy } from "./page-copy";
import { squarePageEn } from "./square-page.en";
import { squarePageJa } from "./square-page.ja";

export type ShapeSlug = "circle-crop-image" | "square-an-image" | "flip-image" | "mirror-image";

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
  "flip-image": {
    name: "Flip Image",
    localNames: { ja: "画像を反転", es: "Voltear imagen", id: "Mirror Foto" },
    copy: { en: flipPageEn, ja: flipPageJa, es: flipPageEs, id: flipPageId },
  },
  // English only: ja/es/id mirror wording lives on the localized flip pages.
  "mirror-image": {
    name: "Mirror Image",
    localNames: {},
    copy: { en: mirrorPageEn },
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
    description: "画像を丸く切り抜く、画像を正方形にする、画像を反転する。Ordalin の無料画像ツールはブラウザ内で動き、アップロードも登録も不要です。",
    h1: "無料の画像ツール",
    intro: "どのツールも無料で、登録はいりません。画像はブラウザの中で処理され、アップロードされません。",
    tools: {
      "circle-crop-image": { name: "画像を丸く切り抜く", summary: "画像を円形に切り抜き、角が透明なPNGで保存" },
      "square-an-image": { name: "画像を正方形にする", summary: "切り取らずに余白を足すか、1:1 で切り抜いて正方形に" },
      "flip-image": { name: "画像を反転", summary: "画像を左右反転・上下反転、90°回転。JPGは画質そのまま" },
    },
  },
  es: {
    title: "Herramientas gratis para imágenes | Ordalin",
    home: "Inicio",
    description: "Recorta una imagen en círculo o voltea una imagen en espejo. Las herramientas gratis de Ordalin funcionan en tu navegador, sin subir archivos ni registrarte.",
    h1: "Herramientas gratis para imágenes",
    intro: "Todas son gratis y sin registro. Las imágenes se procesan en tu navegador y no se suben a ningún servidor.",
    tools: {
      "circle-crop-image": { name: "Recortar imagen en círculo", summary: "Recorta una foto en círculo y descárgala como PNG con fondo transparente" },
      "flip-image": { name: "Voltear imagen", summary: "Voltea una imagen en espejo o de arriba abajo, o gírala 90°; los JPG sin perder calidad" },
    },
  },
  id: {
    title: "Alat gratis untuk gambar | Ordalin",
    home: "Beranda",
    description: "Crop foto bulat atau mirror foto. Alat gratis Ordalin berjalan di browser, tanpa upload dan tanpa daftar.",
    h1: "Alat gratis untuk gambar",
    intro: "Semuanya gratis dan tanpa daftar. Foto diproses di browser kamu dan tidak diunggah ke server mana pun.",
    tools: {
      "circle-crop-image": { name: "Crop Foto Bulat", summary: "Crop foto jadi bulat dan unduh sebagai PNG dengan latar transparan" },
      "flip-image": { name: "Mirror Foto", summary: "Mirror foto kiri-kanan atau atas-bawah, atau putar 90°; JPG tanpa turun kualitas" },
    },
  },
};

/** hreflang for the free-tools hub: English plus every locale that has a hub. */
export const hubLanguages: Record<string, string> = {
  en: freeToolsHubPath,
  ...Object.fromEntries(Object.keys(localizedHubs).map((locale) => [locale, `/${locale}${freeToolsHubPath}`])),
  "x-default": freeToolsHubPath,
};
