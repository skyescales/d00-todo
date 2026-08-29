import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import LeadForm from "@/components/LeadForm";
import NotesLog from "@/components/NotesLog";
import StatusBadge from "@/components/StatusBadge";
import DeleteLeadButton from "@/components/DeleteLeadButton";
import InstagramSearchButton from "@/components/InstagramSearchButton";
import { Phone, Globe } from "lucide-react";
import InstagramIcon from "@/components/icons/InstagramIcon";
import { formatFollowers } from "@/lib/format";
import type { SerializedLead, SerializedNote } from "@/types/lead";

export const dynamic = "force-dynamic";

function igUrl(handle: string) {
  if (handle.startsWith("http")) return handle;
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: { notes: { orderBy: { createdAt: "desc" } } },
  });
  if (!lead) notFound();

  const { notes: rawNotes, ...leadFields } = lead;
  const serialized: SerializedLead = {
    ...leadFields,
    dateAdded: lead.dateAdded.toISOString(),
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    lastContactDate: lead.lastContactDate?.toISOString() ?? null,
  };
  const notes: SerializedNote[] = rawNotes.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }));

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-fg">{lead.businessName}</h1>
            <StatusBadge status={lead.status} />
          </div>
          <p className="text-sm text-fg-muted mt-1">{lead.city}, FL</p>
          {!lead.instagram && lead.instagramConfidence === "NOT_FOUND" && (
            <p className="text-xs text-amber-600 mt-1">Auto-research looked for an Instagram and couldn&apos;t confirm one.</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-muted transition-all duration-150 hover:scale-105 hover:bg-blue-600 hover:text-white"
            >
              <Phone className="h-4 w-4" strokeWidth={2} />
              Call
            </a>
          )}
          {lead.instagram ? (
            <a
              href={igUrl(lead.instagram)}
              target="_blank"
              rel="noreferrer"
              title={lead.instagramFollowers != null ? `${formatFollowers(lead.instagramFollowers)} followers` : undefined}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-muted transition-all duration-150 hover:scale-105 hover:bg-pink-600 hover:text-white"
            >
              <InstagramIcon className="h-4 w-4" strokeWidth={2} />
              DM{lead.instagramFollowers != null && ` · ${formatFollowers(lead.instagramFollowers)}`}
            </a>
          ) : (
            <InstagramSearchButton businessName={lead.businessName} city={lead.city} />
          )}
          {lead.websiteUrl && (
            <a
              href={lead.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-muted transition-all duration-150 hover:scale-105 hover:bg-line"
            >
              <Globe className="h-4 w-4" strokeWidth={2} />
              Site
            </a>
          )}
        </div>
      </div>

      <LeadForm lead={serialized} />

      <NotesLog leadId={lead.id} initialNotes={notes} />

      <div className="flex justify-end">
        <DeleteLeadButton leadId={lead.id} businessName={lead.businessName} />
      </div>
    </div>
  );
}
