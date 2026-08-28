import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { leadKeys } from "@/lib/dedupe";
import { isLeadStatus } from "@/lib/statuses";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: { notes: { orderBy: { createdAt: "desc" } } },
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const existing = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};

  if (typeof body.businessName === "string" && body.businessName.trim()) {
    data.businessName = body.businessName.trim();
  }
  if (typeof body.city === "string" && body.city.trim()) {
    data.city = body.city.trim();
  }
  if (data.businessName || data.city) {
    const { businessNameKey, cityKey } = leadKeys(
      (data.businessName as string) ?? existing.businessName,
      (data.city as string) ?? existing.city
    );
    const dupe = await prisma.lead.findUnique({
      where: { businessNameKey_cityKey: { businessNameKey, cityKey } },
    });
    if (dupe && dupe.id !== existing.id) {
      return NextResponse.json(
        { error: "duplicate", message: `Another lead already uses "${dupe.businessName}" in ${dupe.city}.` },
        { status: 409 }
      );
    }
    data.businessNameKey = businessNameKey;
    data.cityKey = cityKey;
  }

  if ("socialOnly" in body) data.socialOnly = Boolean(body.socialOnly);
  if ("websiteUrl" in body) data.websiteUrl = data.socialOnly ? null : (body.websiteUrl?.trim() || null);
  if ("instagram" in body) data.instagram = body.instagram?.trim() || null;
  if ("phone" in body) data.phone = body.phone?.trim() || null;
  if ("ownerName" in body) data.ownerName = body.ownerName?.trim() || null;
  if ("weaknessNotes" in body) data.weaknessNotes = body.weaknessNotes?.trim() || null;
  if ("reviewCount" in body) data.reviewCount = body.reviewCount ?? null;
  if ("rating" in body) data.rating = body.rating ?? null;
  if ("yearsInBusiness" in body) data.yearsInBusiness = body.yearsInBusiness ?? null;
  if ("estimatedMembers" in body) data.estimatedMembers = body.estimatedMembers ?? null;
  if ("sizeNotes" in body) data.sizeNotes = body.sizeNotes?.trim() || null;
  if ("source" in body) data.source = body.source?.trim() || null;
  if ("lastContactDate" in body) {
    data.lastContactDate = body.lastContactDate ? new Date(body.lastContactDate) : null;
  }
  if ("status" in body && isLeadStatus(body.status)) {
    data.status = body.status;
  }

  const lead = await prisma.lead.update({ where: { id: params.id }, data });
  return NextResponse.json({ lead });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.lead.delete({ where: { id: params.id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
