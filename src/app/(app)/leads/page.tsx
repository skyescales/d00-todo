"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { SerializedLead } from "@/types/lead";
import type { LeadStatus } from "@prisma/client";
import { STATUS_ORDER, STATUS_LABELS } from "@/lib/statuses";
import LeadTable from "@/components/LeadTable";
import BulkImportModal from "@/components/BulkImportModal";

function LeadsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [leads, setLeads] = useState<SerializedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "dateAdded");
  const [dir, setDir] = useState<"asc" | "desc">((searchParams.get("dir") as "asc" | "desc") ?? "desc");
  const [showImport, setShowImport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      if (city) params.set("city", city);
      params.set("sort", sort);
      params.set("dir", dir);

      setLoading(true);
      fetch(`/api/leads?${params.toString()}`)
        .then((r) => r.json())
        .then((data) => setLeads(data.leads ?? []))
        .finally(() => setLoading(false));

      router.replace(`/leads?${params.toString()}`, { scroll: false });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, city, sort, dir, refreshKey]);

  const cities = useMemo(
    () => Array.from(new Set(leads.map((l) => l.city))).sort(),
    [leads]
  );

  function handleSort(field: string) {
    if (sort === field) {
      setDir(dir === "asc" ? "desc" : "asc");
    } else {
      setSort(field);
      setDir("desc");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Leads</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Bulk Import
          </button>
          <Link
            href="/leads/new"
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700"
          >
            + Add Lead
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 bg-white border border-slate-200 rounded-xl p-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search business name…"
          className="flex-1 min-w-[200px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {(q || status || city) && (
          <button
            onClick={() => {
              setQ("");
              setStatus("");
              setCity("");
            }}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-sm">
          Loading…
        </div>
      ) : (
        <LeadTable leads={leads} sort={sort} dir={dir} onSort={handleSort} />
      )}

      {showImport && (
        <BulkImportModal
          onClose={() => setShowImport(false)}
          onImported={() => {
            setShowImport(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={null}>
      <LeadsPageInner />
    </Suspense>
  );
}
