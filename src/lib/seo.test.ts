import { defaultSocialImage, withSocial } from "./seo";

describe("social metadata", () => {
  it("derives Open Graph and Twitter tags from the page's own metadata", () => {
    const metadata = withSocial({ title: "Find AI tools by goal", description: "Pick a goal.", alternates: { canonical: "/tasks" } });
    expect(metadata.openGraph).toMatchObject({
      type: "website", siteName: "Ordalin", title: "Find AI tools by goal", description: "Pick a goal.", url: "/tasks", images: [defaultSocialImage],
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image", title: "Find AI tools by goal", images: ["/og-default.png"] });
  });

  it("uses absolute titles, a page image, and keeps fields the page already set", () => {
    const image = { url: "/assets/tool.webp", width: 1440, height: 900, alt: "Tool website" };
    const metadata = withSocial({ title: { absolute: "Tool | Ordalin" }, openGraph: { type: "article", title: "Tool" } }, image);
    expect(metadata.openGraph).toMatchObject({ type: "article", title: "Tool", images: [image] });
    expect(metadata.twitter).toMatchObject({ title: "Tool", images: ["/assets/tool.webp"] });
  });

  it("leaves empty not-found metadata alone", () => {
    expect(withSocial({})).toEqual({});
  });
});
