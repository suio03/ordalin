import type { Metadata } from "next";
import { ToolPage } from "@/components/free-tools/image-shape/tool-page";
import { PptxViewerTool } from "@/components/free-tools/pptx-viewer/pptx-viewer-tool";
import { pptxViewerPageEn as copy } from "@/lib/free-tools/pptx-viewer/page.en";
import { freeToolPath } from "@/lib/free-tools/registry";
import { withSocial } from "@/lib/seo";

const PATH = freeToolPath("pptx-viewer");

export const metadata: Metadata = withSocial({
  alternates: { canonical: PATH },
  title: { absolute: copy.title },
  description: copy.description,
});

export default function Page() {
  return <ToolPage copy={copy} path={PATH} name="PPTX Viewer" category="BusinessApplication" tool={<PptxViewerTool name="PPTX viewer" />} />;
}
