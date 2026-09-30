import type { Metadata } from "next";
import { EditorialHub } from "@/components/editorial/editorial-hub";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI tool alternatives",
  description: "Considered replacements for well-known AI tools, with the reasons people switch and where each alternative fits better or worse.",
  alternates: { canonical: "/alternatives" },
};

export default function AlternativesHubPage() {
  return (
    <EditorialHub
      kind="alternatives"
      eyebrow="AI tool alternatives"
      title="Alternatives to the tools everyone knows."
      intro="Considered replacements for well-known AI tools, with the reasons people switch and where each alternative fits better or worse."
    />
  );
}
