import type { Metadata } from "next";
import { EditorialHub } from "@/components/editorial/editorial-hub";
import { editorialHubMetadata } from "@/lib/editorial/metadata";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return editorialHubMetadata("compare", "AI tool comparisons", "Head-to-head comparisons of AI tools people often choose between, with a short verdict and the differences that decide it.");
}

export default function CompareHubPage() {
  return (
    <EditorialHub
      kind="compare"
      eyebrow="AI tool comparisons"
      title="Two tools, one decision."
      intro="Head-to-head comparisons of AI tools people often choose between, with a short verdict and the differences that decide it."
    />
  );
}
