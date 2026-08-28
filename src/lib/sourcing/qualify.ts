// Qualification judgment (weak-marketing signal, affordability, gym-type
// match) is now made by Claude during research (see research.ts) - it can
// actually read the business's website/reviews/socials the way a human
// would, instead of scoring a fixed data structure. This file keeps a thin,
// free, defense-in-depth filter that runs after research: even if the model
// misjudges a business's chain status, we never insert an obvious national
// chain by name.
const CHAIN_BLACKLIST = [
  "planet fitness",
  "la fitness",
  "anytime fitness",
  "orangetheory",
  "orange theory",
  "crunch fitness",
  "gold's gym",
  "golds gym",
  "24 hour fitness",
  "equinox",
  "lifetime fitness",
  "life time",
  "ymca",
  "retro fitness",
  "blink fitness",
  "snap fitness",
  "ufc gym",
  "f45 training",
  "title boxing club",
  "club pilates",
  "pure barre",
  "camp gladiator",
  "burn boot camp",
  "the bar method",
  "9round",
  "workout anytime",
  "youfit",
  "xperience fitness",
  "chuze fitness",
  "in-shape",
  "vasa fitness",
  "esporta fitness",
];

export function isKnownChain(businessName: string): boolean {
  const lower = businessName.toLowerCase();
  return CHAIN_BLACKLIST.some((chain) => lower.includes(chain));
}
