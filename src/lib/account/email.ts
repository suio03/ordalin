/**
 * Collapses the address variants one Gmail inbox accepts (dots, +tags,
 * googlemail.com) so a second free claim on the same inbox is recognised.
 */
export function normalizeEmail(email: string) {
  const [rawLocal, rawDomain] = email.trim().toLowerCase().split("@");
  if (!rawLocal || !rawDomain) return email.trim().toLowerCase();
  const domain = rawDomain === "googlemail.com" ? "gmail.com" : rawDomain;
  let local = rawLocal.split("+")[0];
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return `${local}@${domain}`;
}
