// Ordalin never lists adult or gambling products. A match in the product's own wording turns into a gate skip.

const ADULT = /\b(porn\w*|nsfw|xxx|hentai|nudes?|nudity|nudify|undress\w*|erotic\w*|sexting|sex (?:chat|bot|cam)s?|onlyfans|camgirls?|deepnude)\b/i;
const GAMBLING = /\b(gambl\w*|casinos?|sportsbooks?|sports betting|betting tips|bet predictions?|poker bots?|slot machines?|slots games?|roulette|baccarat|lottery predict\w*|igaming)\b/i;

/** Reasons a product must not be listed; empty when nothing matched. */
export function prohibitedContentReasons(texts: string[]): string[] {
  const reasons: string[] = [];
  const text = texts.join("\n");
  const adult = ADULT.exec(text)?.[0];
  const gambling = GAMBLING.exec(text)?.[0];
  if (adult) reasons.push(`Prohibited content: adult ("${adult}").`);
  if (gambling) reasons.push(`Prohibited content: gambling ("${gambling}").`);
  return reasons;
}
