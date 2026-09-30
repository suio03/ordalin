import type { Metadata } from "next";
import { EditorialHub } from "@/components/editorial/editorial-hub";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Best AI tools",
  description: "Shortlists of the best AI tools for a specific job, with who each one suits, who should skip it, and facts checked against official sources.",
  alternates: { canonical: "/best" },
};

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
