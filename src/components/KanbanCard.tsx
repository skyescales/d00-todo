"use client";

import Link from "next/link";
import type { SerializedLead } from "@/types/lead";
import InstagramSearchButton from "@/components/InstagramSearchButton";

function igUrl(handle: string) {
  if (handle.startsWith("http")) return handle;
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

export default function KanbanCard({
  lead,
  onDragStart,
}: {
  lead: SerializedLead;
  onDragStart: (e: React.DragEvent, leadId: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead.id)}
      className="bg-white border border-slate-200 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow"
    >
      <Link href={`/leads/${lead.id}`} className="font-medium text-sm text-slate-900 hover:text-brand-700 block truncate">
        {lead.businessName}
      </Link>
      <p className="text-xs text-slate-400 mt-0.5">{lead.city}</p>
      {lead.weaknessNotes && (
        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{lead.weaknessNotes}</p>
      )}
      <div className="flex items-center gap-1.5 mt-2">
        {lead.phone && (
          <a
            href={`tel:${lead.phone}`}
            className="h-6 w-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-brand-100 text-xs"
            title="Call"
          >
            📞
          </a>
        )}
        {lead.instagram ? (
          <a
            href={igUrl(lead.instagram)}
            target="_blank"
            rel="noreferrer"
            className="h-6 w-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-pink-100 text-xs"
            title="DM on Instagram"
          >
            📷
          </a>
        ) : (
          <InstagramSearchButton businessName={lead.businessName} city={lead.city} compact />
        )}
        <span className="ml-auto text-[11px] text-slate-400">
          {new Date(lead.dateAdded).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      </div>
    </div>
  );
}
