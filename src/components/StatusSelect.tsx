"use client";

import { useState, useTransition } from "react";
import type { LeadStatus } from "@prisma/client";
import { STATUS_ORDER, STATUS_LABELS, STATUS_STYLES } from "@/lib/statuses";

export default function StatusSelect({
  leadId,
  status,
  onChanged,
  className = "",
}: {
  leadId: string;
  status: LeadStatus;
  onChanged?: (status: LeadStatus) => void;
  className?: string;
}) {
  const [current, setCurrent] = useState(status);
  const [pending, startTransition] = useTransition();

  function handleChange(next: LeadStatus) {
    const prev = current;
    setCurrent(next);
    startTransition(async () => {
      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        setCurrent(prev);
        return;
      }
      onChanged?.(next);
    });
  }

  return (
    <select
      value={current}
      disabled={pending}
      onChange={(e) => handleChange(e.target.value as LeadStatus)}
      className={`text-xs font-medium rounded-full border px-2 py-1 cursor-pointer disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand-500 ${STATUS_STYLES[current]} ${className}`}
    >
      {STATUS_ORDER.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
