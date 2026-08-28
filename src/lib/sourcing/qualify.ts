// Heuristic qualification rules for automated lead sourcing. These are
// necessarily approximate (a Places search can't truly measure "IG inactive
// 3 months") — the goal is a reasonable first pass that a human still
// skims before outreach, not a guarantee.

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

const GYM_KEYWORDS = [
  "gym",
  "fitness",
  "crossfit",
  "cross fit",
  "martial arts",
  "boxing",
  "kickbox",
  "jiu jitsu",
  "jiu-jitsu",
  "jujitsu",
  "taekwondo",
  "karate",
  "mma",
  "muay thai",
  "personal training",
  "training studio",
  "strength",
  "barbell",
  "athletics",
  "conditioning",
];

const FREE_BUILDER_HOSTS = [
  "facebook.com",
  "instagram.com",
  "linktr.ee",
  "linktree",
  "sites.google.com",
  "wixsite.com",
  "weebly.com",
  "square.site",
];

export type PlaceCandidate = {
  name: string;
  types: string[];
  rating?: number;
  userRatingsTotal?: number;
  website?: string;
  businessStatus?: string;
};

export type QualifyResult = {
  qualifies: boolean;
  reasons: string[];
  weaknessNotes: string;
  sizeNotes: string;
  hasWeakWebsite: boolean;
};

function isChain(name: string): boolean {
  const lower = name.toLowerCase();
  return CHAIN_BLACKLIST.some((chain) => lower.includes(chain));
}

function looksLikeGym(name: string, types: string[]): boolean {
  const lower = name.toLowerCase();
  const typeStr = types.join(" ").toLowerCase();
  return (
    GYM_KEYWORDS.some((kw) => lower.includes(kw)) ||
    typeStr.includes("gym") ||
    typeStr.includes("fitness")
  );
}

function websiteLooksWeak(website: string | undefined): boolean {
  if (!website) return true;
  try {
    const host = new URL(website).hostname.replace(/^www\./, "");
    return FREE_BUILDER_HOSTS.some((h) => host.includes(h));
  } catch {
    return true;
  }
}

export function qualify(place: PlaceCandidate): QualifyResult {
  const reasons: string[] = [];

  if (place.businessStatus && place.businessStatus !== "OPERATIONAL") {
    return { qualifies: false, reasons: ["not operational"], weaknessNotes: "", sizeNotes: "", hasWeakWebsite: false };
  }
  if (isChain(place.name)) {
    return { qualifies: false, reasons: ["matches national chain blacklist"], weaknessNotes: "", sizeNotes: "", hasWeakWebsite: false };
  }
  if (!looksLikeGym(place.name, place.types)) {
    return { qualifies: false, reasons: ["doesn't look like a gym/studio"], weaknessNotes: "", sizeNotes: "", hasWeakWebsite: false };
  }

  const reviews = place.userRatingsTotal ?? 0;
  const rating = place.rating ?? 0;
  const hasWeakWebsite = websiteLooksWeak(place.website);

  const weaknessParts: string[] = [];
  if (!place.website) {
    weaknessParts.push("No website found on Google Business Profile");
  } else if (hasWeakWebsite) {
    weaknessParts.push(`Website is just a ${new URL(place.website).hostname} page, not a real site`);
  }
  if (reviews > 0 && reviews < 15) {
    weaknessParts.push(`Thin Google Business Profile (${reviews} reviews)`);
  }
  if (!weaknessParts.length) {
    weaknessParts.push("Flagged by automated scan — verify marketing weakness manually");
  }

  // Weak-marketing signal: no real website, or a thin/neglected profile.
  const hasWeakMarketingSignal = !place.website || hasWeakWebsite || (reviews > 0 && reviews < 15);

  // Affordability signal: enough of a track record / footprint to plausibly
  // support $1-2k/mo, and not a failing business.
  const hasAffordabilitySignal = reviews >= 15 && reviews <= 500 && rating >= 3.7;

  const qualifies = hasWeakMarketingSignal && hasAffordabilitySignal;

  if (qualifies) reasons.push("weak marketing + affordability signals both present");
  else if (!hasWeakMarketingSignal) reasons.push("marketing looks fine (real website + healthy review count)");
  else if (!hasAffordabilitySignal) reasons.push("review count/rating doesn't support $1-2k/mo budget assumption");

  const sizeNotes = [
    reviews ? `${reviews} Google reviews` : "review count unknown",
    rating ? `${rating}★ rating` : "rating unknown",
  ].join(", ");

  return {
    qualifies,
    reasons,
    weaknessNotes: weaknessParts.join("; "),
    sizeNotes,
    hasWeakWebsite,
  };
}
