import Image from "next/image";
import { toolMark } from "@/lib/catalog";
import { catalogAssetUrl } from "@/lib/catalog-assets";
import styles from "./tool-mark.module.css";

export function ToolMark({
  name,
  logoAssetKey,
  variant = "row",
}: {
  name: string;
  logoAssetKey?: string | null;
  variant?: "row" | "hero" | "option";
}) {
  const logoUrl = catalogAssetUrl(logoAssetKey ?? null);
  return (
    <span className={`${styles.mark} ${styles[variant]}`} aria-hidden="true">
      {toolMark(name)}
      {logoUrl ? (
        <Image
          className={styles.image}
          src={logoUrl}
          alt=""
          width={variant === "hero" ? 72 : variant === "option" ? 48 : 40}
          height={variant === "hero" ? 72 : variant === "option" ? 48 : 40}
          unoptimized
        />
      ) : null}
    </span>
  );
}
