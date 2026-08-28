import { prisma } from "@/lib/db";
import { leadKeys } from "@/lib/dedupe";
import { FLORIDA_REGIONS } from "./regions";
import { fetchCandidatesForRegion, findInstagramFromWebsite } from "./googlePlaces";
import { qualify } from "./qualify";
import { sendDailyLeadEmail } from "@/lib/email";
import type { Lead } from "@prisma/client";

// Picks the region that hasn't been searched in the longest time (or ever),
// so a full run of the state happens before anything repeats.
async function pickNextRegion(): Promise<string> {
  const runs = await prisma.sourcingRun.findMany({
    orderBy: { ranAt: "desc" },
    take: 500,
    select: { region: true, ranAt: true },
  });

  const lastSeen = new Map<string, Date>();
  for (const run of runs) {
    if (!lastSeen.has(run.region)) lastSeen.set(run.region, run.ranAt);
  }

  let best = FLORIDA_REGIONS[0];
  let bestTime = Infinity;
  for (const region of FLORIDA_REGIONS) {
    const seen = lastSeen.get(region);
    const t = seen ? seen.getTime() : -Infinity;
    if (t < bestTime) {
      bestTime = t;
      best = region;
    }
  }
  return best;
}

export async function runDailySourcing() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const region = await pickNextRegion();

  if (!apiKey) {
    await prisma.sourcingRun.create({
      data: { region, candidates: 0, leadsAdded: 0, error: "GOOGLE_PLACES_API_KEY not configured" },
    });
    return { region, candidates: 0, added: 0, error: "GOOGLE_PLACES_API_KEY not configured" };
  }

  let candidates: Awaited<ReturnType<typeof fetchCandidatesForRegion>> = [];
  try {
    candidates = await fetchCandidatesForRegion(region, apiKey);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error fetching candidates";
    await prisma.sourcingRun.create({ data: { region, candidates: 0, leadsAdded: 0, error: message } });
    return { region, candidates: 0, added: 0, error: message };
  }

  const addedLeads: Lead[] = [];

  for (const candidate of candidates) {
    const result = qualify(candidate);
    if (!result.qualifies) continue;

    const { businessNameKey, cityKey } = leadKeys(candidate.name, region);
    const existing = await prisma.lead.findUnique({
      where: { businessNameKey_cityKey: { businessNameKey, cityKey } },
    });
    if (existing) continue;

    const instagram = candidate.website ? await findInstagramFromWebsite(candidate.website) : null;

    const lead = await prisma.lead.create({
      data: {
        businessName: candidate.name,
        businessNameKey,
        city: region,
        cityKey,
        websiteUrl: candidate.website ?? null,
        socialOnly: !candidate.website,
        instagram,
        phone: candidate.phone ?? null,
        weaknessNotes: result.weaknessNotes,
        reviewCount: candidate.userRatingsTotal ?? null,
        rating: candidate.rating ?? null,
        sizeNotes: result.sizeNotes,
        source: "Automated daily scan (Google Places)",
        status: "NEW",
        autoSourced: true,
      },
    });
    addedLeads.push(lead);
  }

  const emailResult = await sendDailyLeadEmail(region, addedLeads);

  await prisma.sourcingRun.create({
    data: {
      region,
      candidates: candidates.length,
      leadsAdded: addedLeads.length,
      emailSent: emailResult.sent,
    },
  });

  return { region, candidates: candidates.length, added: addedLeads.length, email: emailResult };
}
