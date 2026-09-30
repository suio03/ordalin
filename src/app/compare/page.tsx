import type { Metadata } from "next";
import { EditorialHub } from "@/components/editorial/editorial-hub";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI tool comparisons",
  description: "Head-to-head comparisons of AI tools people often choose between, with a short verdict and the differences that decide it.",
  alternates: { canonical: "/compare" },
};

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
