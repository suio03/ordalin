import { RootDocument, rootMetadata } from "@/components/root-document";
import "../globals.css";

export const metadata = rootMetadata;
export { viewport } from "@/components/root-document";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <RootDocument lang="en">{children}</RootDocument>;
}
