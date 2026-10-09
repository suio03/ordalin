/** AI agent pages (src/content/agents); `.av-root` scopes their link styles (components/agents/agents-theme.css). */
export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return <div className="av-root pb-24">{children}</div>;
}
