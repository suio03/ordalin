import { Analytics } from "@/components/analytics";
import type { Metadata, Viewport } from "next";
import { defaultSocialImage } from "@/lib/seo";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Ordalin — Find the right AI tool",
    template: "%s · Ordalin",
  },
  description:
    "A website-checked AI tools directory that helps you browse broadly or find three tools that fit a specific goal.",
  // Fallback for routes without page-level social tags; withSocial() fills the rest.
  openGraph: { type: "website", siteName: "Ordalin", images: [defaultSocialImage] },
  twitter: { card: "summary_large_image", images: [defaultSocialImage.url] },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: "#e9efec",
};

const themeInitializationScript = `
  (function () {
    var preference = "system";
    try {
      var stored = localStorage.getItem("ordalin-theme:v1");
      if (stored === "system" || stored === "light" || stored === "dark") {
        preference = stored;
      }
    } catch (error) {}

    var resolved = preference;
    if (preference === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.setAttribute("data-theme-preference", preference);
    document.documentElement.style.colorScheme = resolved;
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (themeColor) {
      themeColor.setAttribute(
        "content",
        resolved === "dark" ? "#1c2522" : "#e9efec"
      );
    });
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
