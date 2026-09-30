import type { EditorialPage } from "@/lib/editorial/types";
import { demoEditorialPages } from "./demo";

// Add one static import per article so the bundle works on Cloudflare Workers
// without runtime filesystem reads. Keep each list alphabetical.
export const bestPages: EditorialPage[] = [];
export const alternativesPages: EditorialPage[] = [];
export const comparePages: EditorialPage[] = [];

export const editorialPages: EditorialPage[] = [
  ...bestPages,
  ...alternativesPages,
  ...comparePages,
  ...(process.env.ORDALIN_DEMO === "1" ? demoEditorialPages : []),
];
