import type { Metadata } from "next";
import { ToolPage } from "@/components/free-tools/image-shape/tool-page";
import { XlsxViewerTool } from "@/components/free-tools/xlsx-viewer/xlsx-viewer-tool";
import { xlsxViewerPageEn as copy } from "@/lib/free-tools/xlsx-viewer/page.en";
import { freeToolPath } from "@/lib/free-tools/registry";
import { withSocial } from "@/lib/seo";

const PATH = freeToolPath("xlsx-viewer");

export const metadata: Metadata = withSocial({
  alternates: { canonical: PATH },
  title: { absolute: copy.title },
  description: copy.description,
});

export default function Page() {
  return <ToolPage copy={copy} path={PATH} name="XLSX Viewer" category="BusinessApplication" tool={<XlsxViewerTool name="XLSX viewer" />} />;
}
