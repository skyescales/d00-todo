import { prisma } from "@/lib/db";
import { STATUS_ORDER, STATUS_LABELS, CONTACTED_STATUSES } from "@/lib/statuses";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import TrendChart from "@/components/TrendChart";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [total, byStatusRaw, leads, recentSourcing] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.lead.findMany({ select: { dateAdded: true, status: true } }),
    prisma.sourcingRun.findMany({ orderBy: { ranAt: "desc" }, take: 5 }),
  ]);

  const byStatus: Record<string, number> = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0]));
  for (const row of byStatusRaw) byStatus[row.status] = row._count._all;

  const contacted = leads.filter((l) => CONTACTED_STATUSES.includes(l.status)).length;
  const replied = byStatus["REPLIED"] + byStatus["CLOSED_WON"] + byStatus["CLOSED_LOST"] + byStatus["FOLLOW_UP_SCHEDULED"];
  const closedWon = byStatus["CLOSED_WON"];
  const responseRate = contacted > 0 ? (replied / contacted) * 100 : 0;
  const conversionRate = total > 0 ? (closedWon / total) * 100 : 0;

  const now = new Date();
  const counts = new Map<string, number>();
  for (const l of leads) {
    const key = l.dateAdded.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const trend: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    trend.push({ date: key, count: counts.get(key) ?? 0 });
  }
  const last7 = trend.slice(-7).reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <Link
          href="/leads/new"
          className="sm:hidden inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-brand-600 text-white"
        >
          + Add Lead
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={String(total)} sub={`${last7} added in last 7 days`} />
        <StatCard label="Contacted" value={String(contacted)} sub={`${total ? Math.round((contacted / total) * 100) : 0}% of total`} />
        <StatCard label="Response Rate" value={`${responseRate.toFixed(0)}%`} sub="Replied / Contacted" />
        <StatCard label="Conversion Rate" value={`${conversionRate.toFixed(0)}%`} sub="Closed–Won / Total" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="text-sm font-medium text-slate-700 mb-2">Leads added — last 30 days</h2>
          <TrendChart data={trend} />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="text-sm font-medium text-slate-700 mb-3">Latest auto-sourcing runs</h2>
          {recentSourcing.length === 0 ? (
            <p className="text-sm text-slate-400">No sourcing runs yet. The daily cron job will populate this.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentSourcing.map((run) => (
                <li key={run.id} className="flex items-center justify-between">
                  <span className="text-slate-600">{run.region}</span>
                  <span className={run.error ? "text-red-600" : "text-slate-500"}>
                    {run.error ? "error" : `+${run.leadsAdded} of ${run.candidates}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-medium text-slate-700 mb-3">Pipeline breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {STATUS_ORDER.map((status) => (
            <Link
              href={`/leads?status=${status}`}
              key={status}
              className="border border-slate-200 rounded-lg p-3 hover:border-brand-300 hover:bg-brand-50/40 transition-colors"
            >
              <div className="mb-1">
                <StatusBadge status={status} />
              </div>
              <p className="text-lg font-semibold text-slate-900">{byStatus[status]}</p>
              <p className="text-[11px] text-slate-400">{STATUS_LABELS[status]}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
