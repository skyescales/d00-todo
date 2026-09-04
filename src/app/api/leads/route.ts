import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { leadKeys } from "@/lib/dedupe";
import { isLeadStatus } from "@/lib/statuses";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status");
  const city = searchParams.get("city");
  const source = searchParams.get("source");
  const sort = searchParams.get("sort") ?? "dateAdded";
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";

  const where: Prisma.LeadWhereInput = {};
  if (q) {
    where.businessName = { contains: q, mode: "insensitive" };
  }
  if (status && isLeadStatus(status)) {
    where.status = status;
  }
  if (city) {
    where.city = { equals: city, mode: "insensitive" };
  }
  if (source) {
    where.source = { equals: source, mode: "insensitive" };
  }

  const sortableFields = new Set(["dateAdded", "businessName", "city", "status", "lastContactDate"]);
  const orderBy: Prisma.LeadOrderByWithRelationInput = sortableFields.has(sort)
    ? { [sort]: dir }
    : { dateAdded: "desc" };

  const leads = await prisma.lead.findMany({ where, orderBy });
  return NextResponse.json({ leads });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.businessName !== "string" || typeof body.city !== "string") {
    return NextResponse.json({ error: "businessName and city are required." }, { status: 400 });
  }
  if (!body.businessName.trim() || !body.city.trim()) {
    return NextResponse.json({ error: "businessName and city are required." }, { status: 400 });
  }

  const { businessNameKey, cityKey } = leadKeys(body.businessName, body.city);

  const existing = await prisma.lead.findUnique({
    where: { businessNameKey_cityKey: { businessNameKey, cityKey } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "duplicate", message: `A lead named "${existing.businessName}" in ${existing.city} already exists.`, existingId: existing.id },
      { status: 409 }
    );
  }

  const instagram = body.instagram?.trim() || null;

  const lead = await prisma.lead.create({
    data: {
      businessName: body.businessName.trim(),
      businessNameKey,
      city: body.city.trim(),
      cityKey,
      websiteUrl: body.socialOnly ? null : (body.websiteUrl?.trim() || null),
      socialOnly: Boolean(body.socialOnly),
      instagram,
      // A human filled this in by hand - treat it as verified.
      instagramConfidence: instagram ? "VERIFIED" : null,
      instagramFollowers: body.instagramFollowers ?? null,
      phone: body.phone?.trim() || null,
      ownerName: body.ownerName?.trim() || null,
      weaknessNotes: body.weaknessNotes?.trim() || null,
      reviewCount: body.reviewCount ?? null,
      rating: body.rating ?? null,
      yearsInBusiness: body.yearsInBusiness ?? null,
      estimatedMembers: body.estimatedMembers ?? null,
      sizeNotes: body.sizeNotes?.trim() || null,
      source: body.source?.trim() || null,
      status: isLeadStatus(body.status) ? body.status : "NEW",
    },
  });

  return NextResponse.json({ lead }, { status: 201 });
}
