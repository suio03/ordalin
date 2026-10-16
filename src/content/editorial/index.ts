import type { EditorialPage } from "@/lib/editorial/types";
import { aiMusicGenerators } from "./best/ai-music-generators";
import { cursorAlternatives } from "./alternatives/cursor";
import { fathomAlternatives } from "./alternatives/fathom";
import { udioAlternatives } from "./alternatives/udio";
import { longVideoToShortClips } from "./best/ai-tools-long-video-to-short-clips";
import { argonVsOpus } from "./compare/gemini-4-argon-vs-claude-opus-5-5";
import { haikuVsLuna } from "./compare/claude-haiku-5-5-vs-gpt-6-luna";
import { heygenVsSynthesia } from "./compare/heygen-vs-synthesia";
import { otterVsFireflies } from "./compare/otter-ai-vs-fireflies-ai";
import { sunoVsUdio } from "./compare/suno-vs-udio";
import { viduQ4VsMinimaxH3 } from "./compare/vidu-q4-vs-minimax-h3";
import { demoEditorialPages } from "./demo";

// Add one static import per article so the bundle works on Cloudflare Workers
// without runtime filesystem reads. Keep each list alphabetical.
export const bestPages: EditorialPage[] = [aiMusicGenerators, longVideoToShortClips];
export const alternativesPages: EditorialPage[] = [cursorAlternatives, fathomAlternatives, udioAlternatives];
export const comparePages: EditorialPage[] = [haikuVsLuna, argonVsOpus, heygenVsSynthesia, otterVsFireflies, sunoVsUdio, viduQ4VsMinimaxH3];

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
