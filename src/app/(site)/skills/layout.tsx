/** Agent skill pages (src/content/skills); they reuse the /agents components, so `.av-root` scopes the same link styles. */
export default function SkillsLayout({ children }: { children: React.ReactNode }) {
  return <div className="av-root pb-24">{children}</div>;
}
