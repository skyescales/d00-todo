"use client";

import Link from "next/link";
import type { SerializedLead } from "@/types/lead";
import StatusSelect from "@/components/StatusSelect";
import InstagramSearchButton from "@/components/InstagramSearchButton";

function igUrl(handle: string) {
  if (handle.startsWith("http")) return handle;
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

export default function LeadTable({
  leads,
  sort,
  dir,
  onSort,
}: {
  leads: SerializedLead[];
  sort: string;
  dir: "asc" | "desc";
  onSort: (field: string) => void;
}) {
  function SortHeader({ field, label }: { field: string; label: string }) {
    const active = sort === field;
    return (
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-1 text-xs font-semibold text-fg-muted uppercase tracking-wide hover:text-fg"
      >
        {label}
        {active && <span>{dir === "asc" ? "↑" : "↓"}</span>}
      </button>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="bg-surface border border-line rounded-xl p-12 text-center text-fg-subtle text-sm">
        No leads match your filters yet.
      </div>
    );
  }

  return (
    <div className="bg-surface border border-line rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th className="px-4 py-3">
              <SortHeader field="businessName" label="Business" />
            </th>
            <th className="px-4 py-3">
              <SortHeader field="city" label="City" />
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-fg-muted uppercase tracking-wide">Quick actions</th>
            <th className="px-4 py-3">
              <SortHeader field="status" label="Status" />
            </th>
            <th className="px-4 py-3">
              <SortHeader field="dateAdded" label="Added" />
            </th>
            <th className="px-4 py-3">
              <SortHeader field="lastContactDate" label="Last Contact" />
            </th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-line last:border-0 hover:bg-surface-muted">
              <td className="px-4 py-3">
                <Link href={`/leads/${lead.id}`} className="font-medium text-fg hover:text-brand-700">
                  {lead.businessName}
                </Link>
                {lead.weaknessNotes && (
                  <p className="text-xs text-fg-subtle max-w-xs truncate">{lead.weaknessNotes}</p>
                )}
              </td>
              <td className="px-4 py-3 text-fg-muted">{lead.city}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone}`}
                      title={`Call ${lead.phone}`}
                      className="h-7 w-7 flex items-center justify-center rounded-full bg-surface-muted hover:bg-brand-100 text-fg-muted hover:text-brand-700"
                    >
                      📞
                    </a>
                  )}
                  {lead.instagram ? (
                    <a
                      href={igUrl(lead.instagram)}
                      target="_blank"
                      rel="noreferrer"
                      title="Open Instagram"
                      className="h-7 w-7 flex items-center justify-center rounded-full bg-surface-muted hover:bg-pink-100 text-fg-muted hover:text-pink-600"
                    >
                      📷
                    </a>
                  ) : (
                    <InstagramSearchButton businessName={lead.businessName} city={lead.city} compact />
                  )}
                  {lead.websiteUrl && (
                    <a
                      href={lead.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Visit website"
                      className="h-7 w-7 flex items-center justify-center rounded-full bg-surface-muted hover:bg-line text-fg-muted"
                    >
                      🌐
                    </a>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusSelect leadId={lead.id} status={lead.status} />
              </td>
              <td className="px-4 py-3 text-fg-muted whitespace-nowrap">
                {new Date(lead.dateAdded).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-fg-muted whitespace-nowrap">
                {lead.lastContactDate ? new Date(lead.lastContactDate).toLocaleDateString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
