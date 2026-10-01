import type { Metadata } from "next";

export type SocialImage = { url: string; width?: number; height?: number; alt?: string };

export const defaultSocialImage: SocialImage = {
  url: "/og-default.png",
  width: 1200,
  height: 630,
  alt: "Ordalin — Find the right AI tool",
};

function plainTitle(title: Metadata["title"]) {
  if (!title) return undefined;
  if (typeof title === "string") return title;
  if ("absolute" in title && title.absolute) return title.absolute;
  return "default" in title ? title.default : undefined;
}

/**
 * Fills Open Graph and Twitter tags from a page's own title, description and
 * canonical, because Next does not derive them and a page-level `openGraph`
 * replaces the layout's. Fields the page already sets win.
 */
export function withSocial(metadata: Metadata, image: SocialImage | null = defaultSocialImage): Metadata {
  if (!metadata.title) return metadata;
  const title = plainTitle(metadata.openGraph?.title ?? metadata.title);
  const description = metadata.openGraph?.description ?? metadata.description ?? undefined;
  const url = metadata.alternates?.canonical ?? undefined;
  const images = metadata.openGraph?.images ?? (image ? [image] : undefined);
  return {
    ...metadata,
    openGraph: {
      type: "website",
      siteName: "Ordalin",
      title,
      description,
      ...(url ? { url: typeof url === "object" && "url" in url ? url.url : url } : {}),
      images,
      ...metadata.openGraph,
    } as Metadata["openGraph"],
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images ? [images].flat().map((item) => typeof item === "object" && "url" in item ? item.url : item) : undefined,
      ...metadata.twitter,
    } as Metadata["twitter"],
  };
}
