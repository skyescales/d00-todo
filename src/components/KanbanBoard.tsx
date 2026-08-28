"use client";

import { useEffect, useState } from "react";
import type { SerializedLead } from "@/types/lead";
import type { LeadStatus } from "@prisma/client";
import { STATUS_ORDER, STATUS_LABELS, STATUS_STYLES } from "@/lib/statuses";
import KanbanCard from "@/components/KanbanCard";

export default function KanbanBoard() {
  const [leads, setLeads] = useState<SerializedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOverStatus, setDragOverStatus] = useState<LeadStatus | null>(null);

  useEffect(() => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((data) => setLeads(data.leads ?? []))
      .finally(() => setLoading(false));
  }, []);

  function onDragStart(e: React.DragEvent, leadId: string) {
    e.dataTransfer.setData("text/plain", leadId);
  }

  async function onDrop(e: React.DragEvent, status: LeadStatus) {
    e.preventDefault();
    setDragOverStatus(null);
    const leadId = e.dataTransfer.getData("text/plain");
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === status) return;

    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));

    const res = await fetch(`/api/leads/${leadId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: lead.status } : l)));
    }
  }

  if (loading) {
    return (
      <div className="bg-surface border border-line rounded-xl p-12 text-center text-fg-subtle text-sm">
        Loading board…
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {STATUS_ORDER.map((status) => {
        const columnLeads = leads.filter((l) => l.status === status);
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatus(status);
            }}
            onDragLeave={() => setDragOverStatus((s) => (s === status ? null : s))}
            onDrop={(e) => onDrop(e, status)}
            className={`w-72 shrink-0 rounded-xl border transition-colors ${
              dragOverStatus === status ? "border-brand-400 bg-brand-50/40" : "border-line bg-surface-muted"
            }`}
          >
            <div className={`sticky top-0 px-3 py-2 rounded-t-xl border-b ${STATUS_STYLES[status]} border-transparent`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{STATUS_LABELS[status]}</h3>
                <span className="text-xs font-medium bg-surface/70 rounded-full px-1.5">{columnLeads.length}</span>
              </div>
            </div>
            <div className="p-2 space-y-2 min-h-[120px]">
              {columnLeads.map((lead) => (
                <KanbanCard key={lead.id} lead={lead} onDragStart={onDragStart} />
              ))}
              {columnLeads.length === 0 && (
                <p className="text-xs text-fg-subtle text-center py-4">Drop leads here</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
