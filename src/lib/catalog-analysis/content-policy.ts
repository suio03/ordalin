// Ordalin never lists adult or gambling products. Both checks below turn into a gate skip.

export type DomainCategory = { id: number; name: string };

/** Cloudflare content category ids (`cf zero-trust gateway categories list`). */
const BLOCKED_CATEGORY_IDS = new Set([
  2, 67, 125, 133, // Adult Themes, Nudity, Pornography
  8, 99, // Gambling
  80, 83, 117, 131, 151, 153, 187, 191, // C&C/botnet, cryptomining, malware, phishing, spam, spyware, compromised, scam
]);

const ADULT = /\b(porn\w*|nsfw|xxx|hentai|nudes?|nudity|nudify|undress\w*|erotic\w*|sexting|sex (?:chat|bot|cam)s?|onlyfans|camgirls?|deepnude)\b/i;
const GAMBLING = /\b(gambl\w*|casinos?|sportsbooks?|sports betting|betting tips|bet predictions?|poker bots?|slot machines?|slots games?|roulette|baccarat|lottery predict\w*|igaming)\b/i;

/** Reasons a product must not be listed; empty when nothing matched. */
export function prohibitedContentReasons(texts: string[], domainCategories: DomainCategory[] = []): string[] {
  const reasons: string[] = [];
  const text = texts.join("\n");
  const adult = ADULT.exec(text)?.[0];
  const gambling = GAMBLING.exec(text)?.[0];
  if (adult) reasons.push(`Prohibited content: adult ("${adult}").`);
  if (gambling) reasons.push(`Prohibited content: gambling ("${gambling}").`);
  for (const category of domainCategories) {
    if (BLOCKED_CATEGORY_IDS.has(category.id)) reasons.push(`Prohibited content: Cloudflare classifies the domain as ${category.name}.`);
  }
  return [...new Set(reasons)];
}
