import type { PlaceCandidate } from "./qualify";

const TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";
const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";

type TextSearchResult = {
  place_id: string;
  name: string;
  types?: string[];
  business_status?: string;
};

type DetailsResult = {
  name: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  types?: string[];
};

export type SourcedPlace = PlaceCandidate & {
  placeId: string;
  phone?: string;
};

const QUERY_TERMS = [
  "gym",
  "fitness studio",
  "crossfit box",
  "martial arts gym",
  "boxing gym",
  "personal training studio",
];

export async function searchPlacesForRegion(region: string, apiKey: string): Promise<TextSearchResult[]> {
  const results: TextSearchResult[] = [];
  const seen = new Set<string>();

  for (const term of QUERY_TERMS) {
    const url = new URL(TEXT_SEARCH_URL);
    url.searchParams.set("query", `${term} in ${region}, Florida`);
    url.searchParams.set("key", apiKey);

    try {
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) continue;
      const data = await res.json();
      for (const r of data.results ?? []) {
        if (!seen.has(r.place_id)) {
          seen.add(r.place_id);
          results.push(r);
        }
      }
    } catch {
      // Skip this term on network/API error; other terms may still succeed.
    }
  }

  return results;
}

export async function getPlaceDetails(placeId: string, apiKey: string): Promise<DetailsResult | null> {
  const url = new URL(DETAILS_URL);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set(
    "fields",
    "name,formatted_phone_number,international_phone_number,website,rating,user_ratings_total,business_status,types"
  );
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result ?? null;
  } catch {
    return null;
  }
}

export async function fetchCandidatesForRegion(region: string, apiKey: string): Promise<SourcedPlace[]> {
  const found = await searchPlacesForRegion(region, apiKey);
  const candidates: SourcedPlace[] = [];

  for (const place of found) {
    const details = await getPlaceDetails(place.place_id, apiKey);
    if (!details) continue;
    candidates.push({
      placeId: place.place_id,
      name: details.name,
      types: details.types ?? place.types ?? [],
      rating: details.rating,
      userRatingsTotal: details.user_ratings_total,
      website: details.website,
      businessStatus: details.business_status ?? place.business_status,
      phone: details.formatted_phone_number ?? details.international_phone_number,
    });
  }

  return candidates;
}

// Best-effort: look for an Instagram link on the business's own website.
// Returns null on any failure — Instagram handle discovery is a bonus,
// never a blocker for inserting the lead.
export async function findInstagramFromWebsite(website: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(website, { signal: controller.signal, redirect: "follow" });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+/);
    if (!match) return null;
    return match[0].replace(/\/$/, "");
  } catch {
    return null;
  }
}
