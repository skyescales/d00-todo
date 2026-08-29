"use client";

import { useEffect, useState } from "react";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/statuses";
import type { LeadStatus } from "@prisma/client";

type Stats = {
  total: number;
  byStatus: Record<string, number>;
  contacted: number;
  responseRate: number;
  conversionRate: number;
};

// The handful of statuses worth a glance while you're heads-down working
// the list - full breakdown is on the Dashboard.
const HIGHLIGHT: LeadStatus[] = [
  "NEW",
  "DM_SENT",
  "REPLIED",
  "FOLLOW_UP_SCHEDULED",
  "NOT_INTERESTED",
  "NOT_A_FIT",
  "DEAD",
  "CLOSED_WON",
];

export default function LeadsStatsBar({ refreshKey }: { refreshKey: number }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, [refreshKey]);

  if (!stats) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 bg-surface border border-line rounded-xl p-3">
      <div className="pr-3 mr-1 border-r border-line">
        <p className="text-lg font-semibold text-fg leading-none">{stats.total}</p>
        <p className="text-[11px] text-fg-subtle uppercase tracking-wide mt-0.5">Total</p>
      </div>
      {HIGHLIGHT.map((status) => (
        <div
          key={status}
          className={`flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-1 border ${STATUS_STYLES[status]}`}
          title={STATUS_LABELS[status]}
        >
          <span className="h-5 min-w-5 px-1 rounded-full bg-black/20 flex items-center justify-center text-xs font-bold">
            {stats.byStatus[status] ?? 0}
          </span>
          <span className="text-xs font-medium">{STATUS_LABELS[status]}</span>
        </div>
      ))}
      <div className="ml-auto flex items-center gap-4 pl-2 text-xs text-fg-muted">
        <span>
          <span className="font-semibold text-fg">{stats.contacted}</span> contacted
        </span>
        <span>
          <span className="font-semibold text-fg">{(stats.responseRate * 100).toFixed(0)}%</span> response rate
        </span>
      </div>
    </div>
  );
}
