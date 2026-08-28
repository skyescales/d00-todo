import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { leadKeys } from "@/lib/dedupe";
import type { ImportRow } from "@/lib/csv";

type Result = {
  total: number;
  inserted: number;
  skippedDuplicates: { businessName: string; city: string }[];
  errors: { row: number; message: string }[];
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const rows: ImportRow[] = Array.isArray(body?.rows) ? body.rows : [];
  if (!rows.length) {
    return NextResponse.json({ error: "No rows provided." }, { status: 400 });
  }

  const result: Result = { total: rows.length, inserted: 0, skippedDuplicates: [], errors: [] };

  // Track keys seen within this batch too, so duplicate rows inside the
  // same CSV paste don't both get inserted.
  const seenInBatch = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.businessName?.trim() || !row.city?.trim()) {
      result.errors.push({ row: i + 1, message: "Missing business name or city." });
      continue;
    }

    const { businessNameKey, cityKey } = leadKeys(row.businessName, row.city);
    const batchKey = `${businessNameKey}::${cityKey}`;
    if (seenInBatch.has(batchKey)) {
      result.skippedDuplicates.push({ businessName: row.businessName, city: row.city });
      continue;
    }

    const existing = await prisma.lead.findUnique({
      where: { businessNameKey_cityKey: { businessNameKey, cityKey } },
    });
    if (existing) {
      result.skippedDuplicates.push({ businessName: row.businessName, city: row.city });
      seenInBatch.add(batchKey);
      continue;
    }

    const instagram = row.instagram?.trim() || null;

    await prisma.lead.create({
      data: {
        businessName: row.businessName.trim(),
        businessNameKey,
        city: row.city.trim(),
        cityKey,
        websiteUrl: row.socialOnly ? null : row.websiteUrl?.trim() || null,
        socialOnly: Boolean(row.socialOnly),
        instagram,
        instagramConfidence: instagram ? "VERIFIED" : null,
        phone: row.phone?.trim() || null,
        ownerName: row.ownerName?.trim() || null,
        weaknessNotes: row.weaknessNotes?.trim() || null,
        reviewCount: row.reviewCount ?? null,
        rating: row.rating ?? null,
        yearsInBusiness: row.yearsInBusiness ?? null,
        estimatedMembers: row.estimatedMembers ?? null,
        sizeNotes: row.sizeNotes?.trim() || null,
        source: row.source?.trim() || "CSV import",
        status: "NEW",
      },
    });

    seenInBatch.add(batchKey);
    result.inserted++;
  }

  return NextResponse.json(result);
}
