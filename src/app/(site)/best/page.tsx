import type { Metadata } from "next";
import { EditorialHub } from "@/components/editorial/editorial-hub";
import { editorialHubMetadata } from "@/lib/editorial/metadata";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return editorialHubMetadata("best", "Best AI tools", "Shortlists of the best AI tools for a specific job, with who each one suits, who should skip it, and facts checked against official sources.");
}

export default function BestHubPage() {
  return (
    <EditorialHub
      kind="best"
      eyebrow="Best AI tools"
      title="The best AI tools, by job."
      intro="Shortlists of the best AI tools for a specific job, with who each one suits, who should skip it, and facts checked against official sources."
    />
  );
}
