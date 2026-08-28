"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteLeadButton({ leadId, businessName }: { leadId: string; businessName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-sm text-red-600 hover:text-red-700"
      >
        Delete lead
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-fg-muted">Delete {businessName}?</span>
      <button
        disabled={deleting}
        onClick={async () => {
          setDeleting(true);
          await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
          router.push("/leads");
          router.refresh();
        }}
        className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "Confirm"}
      </button>
      <button onClick={() => setConfirming(false)} className="text-fg-muted hover:text-fg">
        Cancel
      </button>
    </div>
  );
}
