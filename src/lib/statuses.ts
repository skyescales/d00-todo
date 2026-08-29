import type { LeadStatus } from "@prisma/client";

export const STATUS_ORDER: LeadStatus[] = [
  "NEW",
  "DM_SENT",
  "CALLED",
  "LEFT_VOICEMAIL",
  "NO_ANSWER",
  "REPLIED",
  "LEFT_ON_READ",
  "GHOSTED",
  "FOLLOW_UP_SCHEDULED",
  "NOT_INTERESTED",
  "NOT_A_FIT",
  "DEAD",
  "CLOSED_WON",
  "CLOSED_LOST",
];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  DM_SENT: "DM Sent",
  CALLED: "Called",
  LEFT_VOICEMAIL: "Left Voicemail",
  NO_ANSWER: "No Answer / No Pickup",
  REPLIED: "Replied",
  LEFT_ON_READ: "Left on Read",
  GHOSTED: "Ghosted",
  NOT_INTERESTED: "Not Interested",
  NOT_A_FIT: "Not a Fit",
  DEAD: "Dead",
  FOLLOW_UP_SCHEDULED: "Follow Up Scheduled",
  CLOSED_WON: "Closed – Won",
  CLOSED_LOST: "Closed – Lost",
};

// Tailwind class pairs (bg/text/border) per status - soft tinted background
// with bright colored text, matching the dark theme instead of screaming
// solid blocks. Each status keeps a distinct hue so they're still
// instantly distinguishable, just toned down to fit the chill dark vibe.
export const STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  DM_SENT: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  CALLED: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  LEFT_VOICEMAIL: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
  NO_ANSWER: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  REPLIED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  LEFT_ON_READ: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  GHOSTED: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  FOLLOW_UP_SCHEDULED: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  NOT_INTERESTED: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  NOT_A_FIT: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  DEAD: "bg-neutral-500/15 text-neutral-300 border-neutral-500/30",
  CLOSED_WON: "bg-green-500/15 text-green-300 border-green-500/30",
  CLOSED_LOST: "bg-red-500/15 text-red-300 border-red-500/30",
};

// Statuses that count as "contacted" for response-rate math.
export const CONTACTED_STATUSES: LeadStatus[] = [
  "DM_SENT",
  "CALLED",
  "LEFT_VOICEMAIL",
  "NO_ANSWER",
  "REPLIED",
  "LEFT_ON_READ",
  "GHOSTED",
  "FOLLOW_UP_SCHEDULED",
  "NOT_INTERESTED",
  "NOT_A_FIT",
  "DEAD",
  "CLOSED_WON",
  "CLOSED_LOST",
];

export function isLeadStatus(value: string): value is LeadStatus {
  return (STATUS_ORDER as string[]).includes(value);
}
