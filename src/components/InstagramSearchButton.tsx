import { Search } from "lucide-react";
import IconCircle from "@/components/IconCircle";

function searchUrl(businessName: string, city: string) {
  const query = `${businessName} ${city} Florida instagram`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

// Shown whenever a lead has no Instagram handle on file - one click opens a
// pre-filled Google search so the handle can be found and pasted in by hand.
export default function InstagramSearchButton({
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
  if (compact) {
    return (
      <a
        href={searchUrl(businessName, city)}
        target="_blank"
        rel="noreferrer"
        title="Search Google for this business's Instagram"
        className={className}
      >
        <IconCircle icon={Search} variant="pink" size="sm" />
      </a>
    );
  }

  return (
    <a
      href={searchUrl(businessName, city)}
      target="_blank"
      rel="noreferrer"
      title="Search Google for this business's Instagram"
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium bg-surface-muted text-fg-muted transition-colors hover:bg-pink-600 hover:text-white ${className}`}
    >
      <Search className="h-3.5 w-3.5" strokeWidth={2} />
      Search Instagram
    </a>
  );
}
