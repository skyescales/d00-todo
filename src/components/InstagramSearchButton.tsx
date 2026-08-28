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
  return (
    <a
      href={searchUrl(businessName, city)}
      target="_blank"
      rel="noreferrer"
      title="Search Google for this business's Instagram"
      className={
        compact
          ? `h-6 w-6 flex items-center justify-center rounded-full bg-surface-muted hover:bg-pink-100 text-xs ${className}`
          : `inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-surface-muted text-fg-muted hover:bg-pink-100 hover:text-pink-700 ${className}`
      }
    >
      🔍{!compact && " Search Instagram"}
    </a>
  );
}
