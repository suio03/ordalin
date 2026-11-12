// Single list of Ordalin's free tools. Footer, sitemap and llms.txt read from here,
// so a new tool is added once. Newest last.
export type FreeToolGroup = "site" | "image";
export type FreeTool = { slug: string; name: string; summary: string; group: FreeToolGroup };

// Hub sections, in display order.
export const freeToolGroups: { id: FreeToolGroup; title: string; intro: string }[] = [
  { id: "site", title: "Website and AI search", intro: "Check how AI crawlers, answer engines and social previews see a website." },
  { id: "image", title: "Images", intro: "Crop, square and clean images, including the hidden metadata that makes platforms label an image as AI. Files stay in your browser." },
];

export const freeTools: FreeTool[] = [
  { slug: "ai-visibility-checker", name: "AI visibility checker", summary: "Test whether AI search crawlers can reach and read a website", group: "site" },
  { slug: "llms-txt-generator", name: "llms.txt generator", summary: "Generate an llms.txt file from a site's sitemap", group: "site" },
  { slug: "llms-txt-checker", name: "llms.txt checker", summary: "Validate an llms.txt file's format, delivery and links", group: "site" },
  { slug: "og-image-checker", name: "OG image checker", summary: "Test a page's Open Graph tags and og:image, and preview its share cards", group: "site" },
  { slug: "ai-label-remover", name: "AI label remover", summary: "See which hidden fields make platforms label an image as AI, and remove them in the browser", group: "image" },
  { slug: "ai-metadata-remover", name: "AI metadata remover", summary: "View and remove C2PA, XMP, EXIF and prompt metadata from images, losslessly, in the browser", group: "image" },
  { slug: "circle-crop-image", name: "Circle crop image", summary: "Crop an image into a circle and download a transparent PNG, in the browser", group: "image" },
  { slug: "square-an-image", name: "Square an image", summary: "Make an image square without cropping, with a blurred or solid fill, or crop it 1:1", group: "image" },
];

export const freeToolsHubPath = "/free-tools";
export const freeToolPath = (slug: string) => `/free-tools/${slug}`;
