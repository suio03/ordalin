import type { Metadata } from "next";
import { EditorialHub } from "@/components/editorial/editorial-hub";
import { editorialHubMetadata } from "@/lib/editorial/metadata";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return editorialHubMetadata("alternatives", "AI tool alternatives", "Considered replacements for well-known AI tools, with the reasons people switch and where each alternative fits better or worse.");
}

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
