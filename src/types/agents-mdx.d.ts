declare module "*.mdx" {
  import type { ComponentType } from "react";
  const MDXComponent: ComponentType;
  export default MDXComponent;
  // Named `meta` export of synced agent pages; its shape is checked in src/content/agents/index.ts.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const meta: any;
}
