"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import InstagramIcon from "@/components/icons/InstagramIcon";
import type { SerializedLead } from "@/types/lead";
import InstagramSearchButton from "@/components/InstagramSearchButton";
import IconCircle from "@/components/IconCircle";
import Tooltip from "@/components/Tooltip";
import { formatFollowers } from "@/lib/format";

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
      className="bg-surface border border-line rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow"
    >
      <Link href={`/leads/${lead.id}`} className="font-medium text-sm text-fg hover:text-brand-700 block truncate">
        {lead.businessName}
      </Link>
      <p className="text-xs text-fg-subtle mt-0.5">{lead.city}</p>
      {lead.weaknessNotes && (
        <p className="text-xs text-fg-muted mt-1.5 line-clamp-2">{lead.weaknessNotes}</p>
      )}
      <div className="flex items-center gap-1.5 mt-2">
        {lead.phone && (
          <a href={`tel:${lead.phone}`} title="Call">
            <IconCircle icon={Phone} variant="blue" size="sm" />
          </a>
        )}
        {lead.instagram ? (
          <Tooltip
            label={
              lead.instagramFollowers != null
                ? `${formatFollowers(lead.instagramFollowers)} followers`
                : "DM on Instagram"
            }
          >
            <a href={igUrl(lead.instagram)} target="_blank" rel="noreferrer">
              <IconCircle icon={InstagramIcon} variant="pink" size="sm" />
            </a>
          </Tooltip>
        ) : (
          <InstagramSearchButton businessName={lead.businessName} city={lead.city} compact />
        )}
        <span className="ml-auto text-[11px] text-fg-subtle">
          {new Date(lead.dateAdded).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      </div>
    </div>
  );
}
