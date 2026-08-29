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

// Tailwind class pairs (bg/text/border) per status - solid, saturated colors
// so each stage is instantly distinguishable at a glance (not muted pastels).
export const STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "bg-blue-600 text-white border-blue-700",
  DM_SENT: "bg-cyan-600 text-white border-cyan-700",
  CALLED: "bg-violet-600 text-white border-violet-700",
  LEFT_VOICEMAIL: "bg-fuchsia-600 text-white border-fuchsia-700",
  NO_ANSWER: "bg-amber-600 text-white border-amber-700",
  REPLIED: "bg-emerald-600 text-white border-emerald-700",
  LEFT_ON_READ: "bg-orange-600 text-white border-orange-700",
  GHOSTED: "bg-zinc-600 text-white border-zinc-700",
  FOLLOW_UP_SCHEDULED: "bg-teal-600 text-white border-teal-700",
  NOT_INTERESTED: "bg-rose-600 text-white border-rose-700",
  NOT_A_FIT: "bg-pink-600 text-white border-pink-700",
  DEAD: "bg-neutral-800 text-white border-neutral-900",
  CLOSED_WON: "bg-green-600 text-white border-green-700",
  CLOSED_LOST: "bg-red-600 text-white border-red-700",
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
