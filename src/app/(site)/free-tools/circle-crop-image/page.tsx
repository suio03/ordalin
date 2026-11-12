import { CircleCropTool } from "@/components/free-tools/image-shape/circle-crop-tool";
import { ToolPage } from "@/components/free-tools/image-shape/tool-page";
import { localesFor } from "@/lib/free-tools/i18n";
import { shapeCopy, shapeMetadata, shapePages } from "@/lib/free-tools/image-shape/pages";
import { freeToolPath } from "@/lib/free-tools/registry";

const SLUG = "circle-crop-image";

export const metadata = shapeMetadata(SLUG, "en");

export default function Page() {
  return (
    <ToolPage
      copy={shapeCopy(SLUG, "en")}
      path={freeToolPath(SLUG)}
      name={shapePages[SLUG].name}
      tool={<CircleCropTool />}
      locales={localesFor(SLUG)}
    />
  );
}
