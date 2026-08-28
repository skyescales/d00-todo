import { PrismaClient } from "@prisma/client";
import { leadKeys } from "../src/lib/dedupe";

const prisma = new PrismaClient();

const SAMPLE_LEADS = [
  {
    businessName: "Ironclad Strength & Conditioning",
    city: "Tampa",
    websiteUrl: null,
    socialOnly: true,
    instagram: "@ironcladtampa",
    phone: "813-555-0142",
    ownerName: "Marcus Webb",
    weaknessNotes: "No website, Instagram last posted 4 months ago",
    reviewCount: 87,
    rating: 4.6,
    yearsInBusiness: 6,
    estimatedMembers: 150,
    sizeNotes: "87 Google reviews, 4.6★, ~150 members",
    source: "Manual research",
  },
  {
    businessName: "Sunrise Boxing Academy",
    city: "Orlando",
    websiteUrl: "https://sunriseboxingacademy.wixsite.com/home",
    socialOnly: false,
    instagram: "@sunriseboxingorlando",
    phone: "407-555-0199",
    ownerName: "Dana Reyes",
    weaknessNotes: "Website is a bare Wix template, thin Google Business Profile",
    reviewCount: 22,
    rating: 4.8,
    yearsInBusiness: 3,
    estimatedMembers: 90,
    sizeNotes: "22 Google reviews, 4.8★",
    source: "Manual research",
  },
];

async function main() {
  for (const lead of SAMPLE_LEADS) {
    const { businessNameKey, cityKey } = leadKeys(lead.businessName, lead.city);
    await prisma.lead.upsert({
      where: { businessNameKey_cityKey: { businessNameKey, cityKey } },
      update: {},
      create: { ...lead, businessNameKey, cityKey },
    });
  }
  console.log(`Seeded ${SAMPLE_LEADS.length} sample leads.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
