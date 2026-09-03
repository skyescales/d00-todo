// Shared shape used by both the bulk-import UI and the /api/leads/bulk route.
export type ImportRow = {
  businessName: string;
  city: string;
  websiteUrl?: string;
  socialOnly?: boolean;
  instagram?: string;
  instagramConfidence?: "VERIFIED" | "NOT_FOUND";
  instagramFollowers?: number;
  phone?: string;
  ownerName?: string;
  weaknessNotes?: string;
  reviewCount?: number;
  rating?: number;
  yearsInBusiness?: number;
  estimatedMembers?: number;
  sizeNotes?: string;
  source?: string;
};

// Maps flexible/human header spellings -> canonical ImportRow keys.
const HEADER_ALIASES: Record<string, keyof ImportRow> = {
  businessname: "businessName",
  business: "businessName",
  name: "businessName",
  city: "city",
  cityarea: "city",
  area: "city",
  website: "websiteUrl",
  websiteurl: "websiteUrl",
  url: "websiteUrl",
  instagram: "instagram",
  ig: "instagram",
  instagramhandle: "instagram",
  instagramfollowers: "instagramFollowers",
  followers: "instagramFollowers",
  igfollowers: "instagramFollowers",
  instagramconfidence: "instagramConfidence",
  igconfidence: "instagramConfidence",
  confidence: "instagramConfidence",
  phone: "phone",
  phonenumber: "phone",
  owner: "ownerName",
  ownername: "ownerName",
  manager: "ownerName",
  ownermanagername: "ownerName",
  weaknessnotes: "weaknessNotes",
  marketingweaknessnotes: "weaknessNotes",
  notes: "weaknessNotes",
  reviewcount: "reviewCount",
  reviews: "reviewCount",
  rating: "rating",
  yearsinbusiness: "yearsInBusiness",
  years: "yearsInBusiness",
  estimatedmembers: "estimatedMembers",
  members: "estimatedMembers",
  memberestimate: "estimatedMembers",
  sizenotes: "sizeNotes",
  sizecredibilitysignal: "sizeNotes",
  size: "sizeNotes",
  source: "source",
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function mapCsvRow(raw: Record<string, string>): {
  row: ImportRow | null;
  error: string | null;
} {
  const mapped: Partial<ImportRow> = {};

  for (const [key, value] of Object.entries(raw)) {
    const canonical = HEADER_ALIASES[normalizeHeader(key)];
    if (!canonical || value == null) continue;
    const v = String(value).trim();
    if (v === "") continue;

    if (
      canonical === "reviewCount" ||
      canonical === "yearsInBusiness" ||
      canonical === "estimatedMembers" ||
      canonical === "instagramFollowers"
    ) {
      const n = parseInt(v.replace(/[^0-9]/g, ""), 10);
      if (!Number.isNaN(n)) mapped[canonical] = n;
    } else if (canonical === "rating") {
      const n = parseFloat(v);
      if (!Number.isNaN(n)) mapped.rating = n;
    } else if (canonical === "instagramConfidence") {
      if (/not.?found/i.test(v)) mapped.instagramConfidence = "NOT_FOUND";
      else if (/verif/i.test(v)) mapped.instagramConfidence = "VERIFIED";
    } else if (canonical === "websiteUrl") {
      if (/^none/i.test(v) || /social only/i.test(v)) {
        mapped.socialOnly = true;
      } else {
        mapped.websiteUrl = /^https?:\/\//i.test(v) ? v : `https://${v}`;
      }
    } else {
      // @ts-expect-error - string fields
      mapped[canonical] = v;
    }
  }

  if (!mapped.businessName) {
    return { row: null, error: "Missing business name" };
  }
  if (!mapped.city) {
    return { row: null, error: "Missing city" };
  }

  return { row: mapped as ImportRow, error: null };
}

export const IMPORT_TEMPLATE_HEADERS = [
  "Business Name",
  "City",
  "Website URL",
  "Instagram",
  "Instagram Confidence",
  "Instagram Followers",
  "Phone",
  "Owner Name",
  "Weakness Notes",
  "Review Count",
  "Rating",
  "Years In Business",
  "Estimated Members",
  "Size Notes",
  "Source",
];
