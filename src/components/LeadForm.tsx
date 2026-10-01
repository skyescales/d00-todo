"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SerializedLead } from "@/types/lead";
import { STATUS_ORDER, STATUS_LABELS } from "@/lib/statuses";
import type { LeadStatus } from "@prisma/client";
import InstagramSearchButton from "@/components/InstagramSearchButton";

type FormState = {
  businessName: string;
  city: string;
  websiteUrl: string;
  socialOnly: boolean;
  instagram: string;
  instagramFollowers: string;
  phone: string;
  ownerName: string;
  weaknessNotes: string;
  reviewCount: string;
  rating: string;
  yearsInBusiness: string;
  estimatedMembers: string;
  sizeNotes: string;
  source: string;
  status: LeadStatus;
};

function toFormState(lead?: SerializedLead): FormState {
  return {
    businessName: lead?.businessName ?? "",
    city: lead?.city ?? "",
    websiteUrl: lead?.websiteUrl ?? "",
    socialOnly: lead?.socialOnly ?? false,
    instagram: lead?.instagram ?? "",
    instagramFollowers: lead?.instagramFollowers?.toString() ?? "",
    phone: lead?.phone ?? "",
    ownerName: lead?.ownerName ?? "",
    weaknessNotes: lead?.weaknessNotes ?? "",
    reviewCount: lead?.reviewCount?.toString() ?? "",
    rating: lead?.rating?.toString() ?? "",
    yearsInBusiness: lead?.yearsInBusiness?.toString() ?? "",
    estimatedMembers: lead?.estimatedMembers?.toString() ?? "",
    sizeNotes: lead?.sizeNotes ?? "",
    source: lead?.source ?? "",
    status: lead?.status ?? "NEW",
  };
}

export default function LeadForm({ lead }: { lead?: SerializedLead }) {
  const router = useRouter();
  const isEdit = Boolean(lead);
  const [form, setForm] = useState<FormState>(toFormState(lead));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      businessName: form.businessName,
      city: form.city,
      websiteUrl: form.websiteUrl || null,
      socialOnly: form.socialOnly,
      instagram: form.instagram || null,
      instagramFollowers: form.instagramFollowers ? parseInt(form.instagramFollowers, 10) : null,
      phone: form.phone || null,
      ownerName: form.ownerName || null,
      weaknessNotes: form.weaknessNotes || null,
      reviewCount: form.reviewCount ? parseInt(form.reviewCount, 10) : null,
      rating: form.rating ? parseFloat(form.rating) : null,
      yearsInBusiness: form.yearsInBusiness ? parseInt(form.yearsInBusiness, 10) : null,
      estimatedMembers: form.estimatedMembers ? parseInt(form.estimatedMembers, 10) : null,
      sizeNotes: form.sizeNotes || null,
      source: form.source || null,
      status: form.status,
    };

    const res = await fetch(isEdit ? `/api/leads/${lead!.id}` : "/api/leads", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? data.error ?? "Something went wrong.");
      setSaving(false);
      return;
    }

    const data = await res.json();
    router.push(`/leads/${data.lead.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
      )}

      <section className="bg-surface border border-line rounded-xl p-4 space-y-4">
        <h2 className="text-sm font-semibold text-fg">Basics</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Business Name *">
            <input
              required
              value={form.businessName}
              onChange={(e) => set("businessName", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="City / Area *">
            <input
              required
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              className="input"
              placeholder="e.g. Tampa"
            />
          </Field>
          <Field label="Owner / Manager Name">
            <input value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} className="input" />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="input" placeholder="(555) 555-5555" />
          </Field>
        </div>
      </section>

      <section className="bg-surface border border-line rounded-xl p-4 space-y-4">
        <h2 className="text-sm font-semibold text-fg">Web presence</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Website URL">
            <input
              value={form.websiteUrl}
              disabled={form.socialOnly}
              onChange={(e) => set("websiteUrl", e.target.value)}
              className="input disabled:bg-surface-muted disabled:text-fg-subtle"
              placeholder="https://…"
            />
          </Field>
          <Field label="Instagram">
            <div className="flex items-center gap-2">
              <input
                value={form.instagram}
                onChange={(e) => set("instagram", e.target.value)}
                className="input"
                placeholder="@handle or full URL"
              />
              {!form.instagram && form.businessName && form.city && (
                <InstagramSearchButton businessName={form.businessName} city={form.city} compact />
              )}
            </div>
          </Field>
          <Field label="Instagram Followers">
            <input
              type="number"
              value={form.instagramFollowers}
              onChange={(e) => set("instagramFollowers", e.target.value)}
              className="input"
              placeholder="e.g. 2400"
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-fg-muted">
          <input
            type="checkbox"
            checked={form.socialOnly}
            onChange={(e) => set("socialOnly", e.target.checked)}
            className="rounded border-line"
          />
          No website — social only
        </label>
      </section>

      <section className="bg-surface border border-line rounded-xl p-4 space-y-4">
        <h2 className="text-sm font-semibold text-fg">Qualification</h2>
        <Field label="Marketing Weakness Notes">
          <textarea
            value={form.weaknessNotes}
            onChange={(e) => set("weaknessNotes", e.target.value)}
            rows={2}
            className="input"
            placeholder="e.g. no website, IG inactive 3mo"
          />
        </Field>
        <div className="grid sm:grid-cols-4 gap-4">
          <Field label="Review Count">
            <input
              type="number"
              value={form.reviewCount}
              onChange={(e) => set("reviewCount", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Rating">
            <input
              type="number"
              step="0.1"
              value={form.rating}
              onChange={(e) => set("rating", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Years in Business">
            <input
              type="number"
              value={form.yearsInBusiness}
              onChange={(e) => set("yearsInBusiness", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Est. Members">
            <input
              type="number"
              value={form.estimatedMembers}
              onChange={(e) => set("estimatedMembers", e.target.value)}
              className="input"
            />
          </Field>
        </div>
        <Field label="Size / Credibility Notes">
          <input value={form.sizeNotes} onChange={(e) => set("sizeNotes", e.target.value)} className="input" />
        </Field>
        <Field label="Source">
          <input
            value={form.source}
            onChange={(e) => set("source", e.target.value)}
            className="input"
            placeholder="e.g. Google Maps search, drive-by, referral"
          />
        </Field>
      </section>

      {isEdit && (
        <section className="bg-surface border border-line rounded-xl p-4 space-y-4">
          <h2 className="text-sm font-semibold text-fg">Status</h2>
          <Field label="Pipeline Status">
            <select value={form.status} onChange={(e) => set("status", e.target.value as LeadStatus)} className="input">
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
        </section>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Add lead"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg text-sm font-medium text-fg-muted hover:bg-surface-muted"
        >
          Cancel
        </button>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(var(--color-line));
          background: rgb(var(--color-page));
          color: rgb(var(--color-fg));
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgb(50 139 255 / 0.5);
          border-color: rgb(50 139 255);
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-fg-muted mb-1">{label}</span>
      {children}
    </label>
  );
}
