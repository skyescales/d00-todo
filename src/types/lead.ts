import type { Lead, LeadStatus, Note } from "@prisma/client";

export type SerializedNote = Omit<Note, "createdAt"> & { createdAt: string };

export type SerializedLead = Omit<
  Lead,
  "dateAdded" | "createdAt" | "updatedAt" | "lastContactDate"
> & {
  dateAdded: string;
  createdAt: string;
  updatedAt: string;
  lastContactDate: string | null;
  notes?: SerializedNote[];
};

export type LeadInput = {
  businessName: string;
  city: string;
  websiteUrl?: string | null;
  socialOnly?: boolean;
  instagram?: string | null;
  phone?: string | null;
  ownerName?: string | null;
  weaknessNotes?: string | null;
  reviewCount?: number | null;
  rating?: number | null;
  yearsInBusiness?: number | null;
  estimatedMembers?: number | null;
  sizeNotes?: string | null;
  source?: string | null;
  status?: LeadStatus;
};

export type { LeadStatus };
