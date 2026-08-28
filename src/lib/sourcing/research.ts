import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL = "claude-opus-5";

// Anthropic API list pricing (USD/token, USD/search). Update if
// https://platform.claude.com/docs/en/pricing changes. Used only to log an
// estimated cost per sourcing run - not billing-accurate, but close.
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-5": { input: 5 / 1_000_000, output: 25 / 1_000_000 },
  "claude-sonnet-5": { input: 2 / 1_000_000, output: 10 / 1_000_000 },
  "claude-haiku-4-5": { input: 1 / 1_000_000, output: 5 / 1_000_000 },
};
const WEB_SEARCH_COST_PER_USE = 10 / 1000; // $10 per 1,000 searches
const CACHE_WRITE_MULTIPLIER = 1.25;
const CACHE_READ_MULTIPLIER = 0.1;

const MAX_WEB_SEARCHES = 30;
const MAX_WEB_FETCHES = 20;
const MAX_PAUSE_CONTINUATIONS = 3;

export type ResearchedLead = {
  businessName: string;
  city: string;
  websiteUrl: string | null;
  socialOnly: boolean;
  instagram: string | null;
  instagramConfidence: "VERIFIED" | "NOT_FOUND";
  phone: string | null;
  ownerName: string | null;
  weaknessNotes: string;
  reviewCount: number | null;
  rating: number | null;
  yearsInBusiness: number | null;
  estimatedMembers: number | null;
  sizeNotes: string;
  sourceNotes: string;
};

export type ResearchUsage = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  webSearches: number;
  estimatedCostUsd: number;
};

export type ResearchResult = {
  leads: ResearchedLead[];
  usage: ResearchUsage;
};

const SYSTEM_PROMPT = `You are a lead researcher for a small marketing agency that does cold outreach to independently-owned gyms and fitness businesses in Florida with a plausible $1,000-$2,000/month marketing budget.

Research like a human prospector would: use web search to survey a metro area, skim what comes back, then use web search and web fetch to dig into the specific businesses that look promising (their own website, reviews, socials). Don't just trust one search result - cross-check anything you're unsure about with a follow-up search.

QUALIFYING CRITERIA - a business must clearly meet ALL three:

1. INDEPENDENTLY OWNED: a gym, fitness studio, CrossFit box, martial arts/boxing/kickboxing gym, or personal training studio. Never include a large national or regional chain or franchise brand - e.g. Planet Fitness, LA Fitness, Anytime Fitness, Orangetheory, Crunch Fitness, F45, Gold's Gym, 24 Hour Fitness, Equinox, Life Time, YMCA, Retro Fitness, Blink Fitness, Snap Fitness, UFC Gym, Club Pilates, Pure Barre, Camp Gladiator, 9Round, and similar. If you're not sure whether something is a chain, search to confirm before including it.

2. CLEAR WEAK-MARKETING SIGNAL (at least one, and it should be obvious, not a stretch): outdated/broken/missing website, low or stale social media activity (e.g. Instagram that hasn't posted in months, very few followers/posts for a business its size), or a thin/neglected Google Business Profile (few reviews, no recent photos, unanswered reviews, incomplete listing).

3. PLAUSIBLE ABILITY TO AFFORD $1,000-$2,000/MONTH: operating 1+ years, a real facility (not one person training clients out of a garage or park), and a positive-but-modest review base - generally 3.5+ stars with roughly 15-500 reviews. Not failing, but also not already a polished, marketing-savvy operation that clearly doesn't need help.

INSTAGRAM (the most important field to get right): for every qualifying business, actively search for their real Instagram account - try queries like "<business name> <city> instagram". Only set an instagram handle when you actually found and can point to a specific matching profile - never guess, construct, or assume a handle from the business name. If you found and confirmed a real profile, set instagram_confidence to "verified" and fill in the handle. If you looked and could not confirm one, set instagram_confidence to "not_found" and leave instagram null - do not leave this unset without having tried.

Budget your effort: aim to survey on the order of 50-100 candidate businesses across your searches in the requested region (cast a wide net with broad searches), but only spend extra searches/fetches deep-diving on the ones that look like plausible qualifiers. Most surveyed businesses will not qualify and that is expected - be selective and only report ones you're confident about.

Skip anything already listed as "already tracked" in the user's message - do not re-research or re-report those.

When you are done, end your ENTIRE response with exactly one fenced code block, language json, containing a JSON array of the qualifying leads found (or an empty array [] if none qualified). Put nothing after the closing fence. Each array element must be an object with exactly these fields:

{
  "business_name": string,
  "city": string,
  "website_url": string or null,
  "instagram": string or null,
  "instagram_confidence": "verified" or "not_found",
  "phone": string or null,
  "owner_name": string or null,
  "weakness_notes": string (concrete, e.g. "no website found; Google Business Profile has 6 reviews, last one from 2022"),
  "review_count": number or null,
  "rating": number or null,
  "years_in_business": number or null,
  "estimated_members": number or null,
  "size_notes": string (e.g. "42 Google reviews, 4.6 stars, appears to have 3-4 trainers"),
  "source_notes": string (briefly, what you checked - e.g. "Google search + business website + Instagram")
}`;

function buildUserPrompt(region: string, knownBusinessNames: string[]): string {
  const known = knownBusinessNames.length ? knownBusinessNames.join(", ") : "none yet";
  return `Research independently-owned gyms, fitness studios, CrossFit boxes, martial arts/boxing gyms, and personal training studios in and around ${region}, Florida.

Already tracked in our CRM for this area - do not re-suggest these:
${known}

Follow your instructions and return the JSON array of qualifying leads.`;
}

function extractJsonArray(text: string): unknown[] {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i) ?? text.match(/```\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1] : text;
  const parsed = JSON.parse(jsonText.trim());
  if (!Array.isArray(parsed)) throw new Error("Model output was valid JSON but not an array");
  return parsed;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toResearchedLead(raw: unknown): ResearchedLead | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const businessName = str(r.business_name);
  const city = str(r.city);
  if (!businessName || !city) return null;

  const confidence: "VERIFIED" | "NOT_FOUND" = r.instagram_confidence === "verified" ? "VERIFIED" : "NOT_FOUND";
  const instagram = confidence === "VERIFIED" ? str(r.instagram) : null;
  const websiteUrl = str(r.website_url);

  return {
    businessName,
    city,
    websiteUrl,
    socialOnly: !websiteUrl,
    instagram,
    instagramConfidence: confidence,
    phone: str(r.phone),
    ownerName: str(r.owner_name),
    weaknessNotes: str(r.weakness_notes) ?? "",
    reviewCount: num(r.review_count),
    rating: num(r.rating),
    yearsInBusiness: num(r.years_in_business),
    estimatedMembers: num(r.estimated_members),
    sizeNotes: str(r.size_notes) ?? "",
    sourceNotes: str(r.source_notes) ?? "Automated research (Claude + web search)",
  };
}

type UsageTotals = {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  webSearches: number;
};

function estimateCostUsd(model: string, usage: UsageTotals): number {
  const pricing = MODEL_PRICING[model] ?? MODEL_PRICING[DEFAULT_MODEL];
  return (
    usage.inputTokens * pricing.input +
    usage.outputTokens * pricing.output +
    usage.cacheCreationTokens * pricing.input * CACHE_WRITE_MULTIPLIER +
    usage.cacheReadTokens * pricing.input * CACHE_READ_MULTIPLIER +
    usage.webSearches * WEB_SEARCH_COST_PER_USE
  );
}

export async function researchRegion(region: string, knownBusinessNames: string[]): Promise<ResearchResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const model = process.env.SOURCING_MODEL || DEFAULT_MODEL;
  const client = new Anthropic({ apiKey });

  const tools: Anthropic.ToolUnion[] = [
    {
      type: "web_search_20260209",
      name: "web_search",
      max_uses: MAX_WEB_SEARCHES,
      user_location: { type: "approximate", region: "Florida", country: "US" },
    },
    {
      type: "web_fetch_20260209",
      name: "web_fetch",
      max_uses: MAX_WEB_FETCHES,
      max_content_tokens: 8000,
    },
  ];

  let messages: Anthropic.MessageParam[] = [
    { role: "user", content: buildUserPrompt(region, knownBusinessNames) },
  ];

  const totals: UsageTotals = {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    webSearches: 0,
  };

  let finalText = "";
  let sawResponse = false;

  for (let i = 0; i <= MAX_PAUSE_CONTINUATIONS; i++) {
    const stream = client.messages.stream({
      model,
      max_tokens: 32000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      system: SYSTEM_PROMPT,
      // Server-side tools (web_search / web_fetch) - Anthropic executes
      // these and returns results as content blocks in the same response.
      tools,
      messages,
    });

    const response = await stream.finalMessage();
    sawResponse = true;

    totals.inputTokens += response.usage.input_tokens;
    totals.outputTokens += response.usage.output_tokens;
    totals.cacheCreationTokens += response.usage.cache_creation_input_tokens ?? 0;
    totals.cacheReadTokens += response.usage.cache_read_input_tokens ?? 0;
    totals.webSearches += response.usage.server_tool_use?.web_search_requests ?? 0;

    finalText = "";
    for (const block of response.content) {
      if (block.type === "text") finalText += block.text + "\n";
    }

    if (response.stop_reason !== "pause_turn") break;
    messages = [...messages, { role: "assistant", content: response.content }];
  }

  if (!sawResponse) throw new Error("No response from Claude");

  let leads: ResearchedLead[] = [];
  try {
    const parsedArray = extractJsonArray(finalText);
    leads = parsedArray.map(toResearchedLead).filter((l): l is ResearchedLead => l !== null);
  } catch (err) {
    throw new Error(
      `Failed to parse research output as JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return {
    leads,
    usage: {
      model,
      inputTokens: totals.inputTokens,
      outputTokens: totals.outputTokens,
      webSearches: totals.webSearches,
      estimatedCostUsd: estimateCostUsd(model, totals),
    },
  };
}
