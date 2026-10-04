import type { EditorialPage } from "@/lib/editorial/types";
import { longVideoToShortClips } from "./best/ai-tools-long-video-to-short-clips";
import { heygenVsSynthesia } from "./compare/heygen-vs-synthesia";
import { otterVsFireflies } from "./compare/otter-ai-vs-fireflies-ai";
import { sunoVsUdio } from "./compare/suno-vs-udio";
import { demoEditorialPages } from "./demo";

// Add one static import per article so the bundle works on Cloudflare Workers
// without runtime filesystem reads. Keep each list alphabetical.
export const bestPages: EditorialPage[] = [longVideoToShortClips];
export const alternativesPages: EditorialPage[] = [];
export const comparePages: EditorialPage[] = [heygenVsSynthesia, otterVsFireflies, sunoVsUdio];

export const editorialPages: EditorialPage[] = [
  ...bestPages,
  ...alternativesPages,
  ...comparePages,
  ...(process.env.ORDALIN_DEMO === "1" ? demoEditorialPages : []),
];

// Homepage "Guides to start with" shows these first, in this order, then fills
// the remaining slots with the newest live articles.
export const pinnedHomepageGuides = [
  "/compare/suno-vs-udio",
  "/best/ai-tools-long-video-to-short-clips",
];
