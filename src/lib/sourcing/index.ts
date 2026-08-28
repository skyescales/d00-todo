import { prisma } from "@/lib/db";
import { leadKeys } from "@/lib/dedupe";
import { FLORIDA_REGIONS } from "./regions";
import { researchRegion } from "./research";
import { isKnownChain } from "./qualify";
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
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const region = await pickNextRegion();

  if (!apiKey) {
    await prisma.sourcingRun.create({
      data: { region, candidates: 0, leadsAdded: 0, error: "ANTHROPIC_API_KEY not configured" },
    });
    return { region, candidates: 0, added: 0, error: "ANTHROPIC_API_KEY not configured" };
  }

  // Give the model a short "already tracked" list so it doesn't waste
  // research budget re-suggesting businesses we already have for this area.
  const existingInRegion = await prisma.lead.findMany({
    where: { city: { equals: region, mode: "insensitive" } },
    select: { businessName: true },
    take: 200,
  });
  const knownNames = existingInRegion.map((l) => l.businessName);

  let researched: Awaited<ReturnType<typeof researchRegion>>;
  try {
    researched = await researchRegion(region, knownNames);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error researching leads";
    await prisma.sourcingRun.create({ data: { region, candidates: 0, leadsAdded: 0, error: message } });
    return { region, candidates: 0, added: 0, error: message };
  }

  const addedLeads: Lead[] = [];

  for (const candidate of researched.leads) {
    if (isKnownChain(candidate.businessName)) continue;

    const city = candidate.city || region;
    const { businessNameKey, cityKey } = leadKeys(candidate.businessName, city);
    const existing = await prisma.lead.findUnique({
      where: { businessNameKey_cityKey: { businessNameKey, cityKey } },
    });
    if (existing) continue;

    const lead = await prisma.lead.create({
      data: {
        businessName: candidate.businessName,
        businessNameKey,
        city,
        cityKey,
        websiteUrl: candidate.websiteUrl,
        socialOnly: candidate.socialOnly,
        instagram: candidate.instagram,
        instagramConfidence: candidate.instagramConfidence,
        phone: candidate.phone,
        ownerName: candidate.ownerName,
        weaknessNotes: candidate.weaknessNotes,
        reviewCount: candidate.reviewCount,
        rating: candidate.rating,
        yearsInBusiness: candidate.yearsInBusiness,
        estimatedMembers: candidate.estimatedMembers,
        sizeNotes: candidate.sizeNotes,
        source: candidate.sourceNotes,
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
      candidates: researched.leads.length,
      leadsAdded: addedLeads.length,
      emailSent: emailResult.sent,
      model: researched.usage.model,
      inputTokens: researched.usage.inputTokens,
      outputTokens: researched.usage.outputTokens,
      webSearches: researched.usage.webSearches,
      estimatedCostUsd: researched.usage.estimatedCostUsd,
    },
  });

  return {
    region,
    candidates: researched.leads.length,
    added: addedLeads.length,
    estimatedCostUsd: researched.usage.estimatedCostUsd,
    email: emailResult,
  };
}
