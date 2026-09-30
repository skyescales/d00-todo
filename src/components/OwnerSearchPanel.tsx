"use client";

import { useState } from "react";
import { Search, ExternalLink } from "lucide-react";
import IconCircle from "@/components/IconCircle";

function googleUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function linkedinUrl(businessName: string) {
  return `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(businessName)}`;
}

function links(businessName: string, city: string) {
  return [
    { label: `Who owns ${businessName}?`, href: googleUrl(`who owns "${businessName}" ${city} Florida`) },
    { label: `"${businessName}" owner`, href: googleUrl(`"${businessName}" ${city} owner`) },
    { label: `"${businessName}" founder`, href: googleUrl(`"${businessName}" ${city} founder`) },
    { label: "Search LinkedIn", href: linkedinUrl(`${businessName} ${city}`) },
    { label: "Search Instagram bio", href: googleUrl(`"${businessName}" ${city} instagram owner OR founder`) },
  ];
}

// Shown whenever a lead has no owner name on file - opens a small panel of
// pre-built searches so a human can find and paste in the owner's name.
export default function OwnerSearchPanel({
  businessName,
  city,
  className = "",
  compact = false,
}: {
  businessName: string;
  city: string;
  className?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const searchLinks = links(businessName, city);

  return (
    <span className={`relative inline-block ${className}`}>
      {compact ? (
        <button type="button" title="Search for this business's owner" onClick={() => setOpen((v) => !v)}>
          <IconCircle icon={Search} variant="blue" size="sm" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium bg-surface-muted text-fg-muted transition-colors hover:bg-blue-600 hover:text-white"
        >
          <Search className="h-3.5 w-3.5" strokeWidth={2} />
          Search Owner
        </button>
      )}

      {open && (
        <div className="absolute z-20 top-full mt-1 left-0 w-64 rounded-lg border border-line bg-surface shadow-lg py-1">
          {searchLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs text-fg hover:bg-surface-muted"
            >
              <span className="truncate">{link.label}</span>
              <ExternalLink className="h-3 w-3 shrink-0 text-fg-subtle" strokeWidth={2} />
            </a>
          ))}
        </div>
      )}
    </span>
  );
}
