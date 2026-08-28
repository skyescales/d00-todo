import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { STATUS_ORDER, CONTACTED_STATUSES } from "@/lib/statuses";

export const dynamic = "force-dynamic";

export async function GET() {
  const [total, byStatusRaw, leads] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.lead.findMany({ select: { dateAdded: true, status: true } }),
  ]);

  const byStatus: Record<string, number> = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0]));
  for (const row of byStatusRaw) {
    byStatus[row.status] = row._count._all;
  }

  const contacted = leads.filter((l) => CONTACTED_STATUSES.includes(l.status)).length;
  const replied = byStatus["REPLIED"] + byStatus["CLOSED_WON"] + byStatus["CLOSED_LOST"] + byStatus["FOLLOW_UP_SCHEDULED"];
  const closedWon = byStatus["CLOSED_WON"];

  const responseRate = contacted > 0 ? replied / contacted : 0;
  const conversionRate = total > 0 ? closedWon / total : 0;

  // Leads added per day for the last 30 days.
  const days: { date: string; count: number }[] = [];
  const now = new Date();
  const counts = new Map<string, number>();
  for (const l of leads) {
    const key = l.dateAdded.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: counts.get(key) ?? 0 });
  }

  return NextResponse.json({
    total,
    byStatus,
    contacted,
    responseRate,
    conversionRate,
    trend: days,
  });
}
