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

// Tailwind class pairs (bg/text/border) per status, kept muted & consistent.
export const STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "bg-slate-100 text-slate-700 border-slate-200",
  DM_SENT: "bg-sky-50 text-sky-700 border-sky-200",
  CALLED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  LEFT_VOICEMAIL: "bg-violet-50 text-violet-700 border-violet-200",
  NO_ANSWER: "bg-amber-50 text-amber-700 border-amber-200",
  REPLIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  LEFT_ON_READ: "bg-orange-50 text-orange-700 border-orange-200",
  GHOSTED: "bg-stone-100 text-stone-600 border-stone-200",
  FOLLOW_UP_SCHEDULED: "bg-teal-50 text-teal-700 border-teal-200",
  NOT_INTERESTED: "bg-rose-50 text-rose-700 border-rose-200",
  NOT_A_FIT: "bg-rose-50 text-rose-700 border-rose-200",
  DEAD: "bg-gray-200 text-gray-600 border-gray-300",
  CLOSED_WON: "bg-green-100 text-green-800 border-green-300",
  CLOSED_LOST: "bg-red-100 text-red-700 border-red-300",
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
