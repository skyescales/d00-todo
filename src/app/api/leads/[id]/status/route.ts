import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isLeadStatus, CONTACTED_STATUSES, STATUS_LABELS } from "@/lib/statuses";

// Quick inline status update, used by the table + kanban board.
// Automatically stamps lastContactDate the first time a lead moves into a
// "contacted" state, so users don't have to set it by hand.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  if (!body || !isLeadStatus(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = { status: body.status };
  if (CONTACTED_STATUSES.includes(body.status)) {
    data.lastContactDate = new Date();
  }

  const lead = await prisma.lead.update({ where: { id: params.id }, data });

  await prisma.note.create({
    data: {
      leadId: lead.id,
      body: `Status changed to "${STATUS_LABELS[body.status as keyof typeof STATUS_LABELS]}".`,
    },
  });

  return NextResponse.json({ lead });
}
