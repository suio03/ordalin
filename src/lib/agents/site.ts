import { catalogWebsiteOutboundUrl } from "@/lib/catalog-links";
import { appBaseUrl } from "@/lib/editorial/metadata";

export { CHECKED_ON } from "./data";

export const absoluteUrl = (path: string) => new URL(path, appBaseUrl()).toString();

/** Official-site link, tagged like every other outbound catalogue link. */
export const outbound = (url: string) => catalogWebsiteOutboundUrl(url);
