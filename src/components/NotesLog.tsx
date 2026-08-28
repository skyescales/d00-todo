"use client";

import { useState } from "react";
import type { SerializedNote } from "@/types/lead";

export default function NotesLog({ leadId, initialNotes }: { leadId: string; initialNotes: SerializedNote[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/leads/${leadId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    setSaving(false);
    if (!res.ok) return;
    const data = await res.json();
    setNotes((prev) => [{ ...data.note, createdAt: data.note.createdAt }, ...prev]);
    setText("");
  }

  return (
    <div className="bg-surface border border-line rounded-xl p-4">
      <h2 className="text-sm font-semibold text-fg mb-3">Follow-Up Notes / Activity Log</h2>
      <form onSubmit={addNote} className="flex gap-2 mb-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a timestamped note…"
          className="flex-1 rounded-lg border border-line bg-page text-fg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          disabled={saving || !text.trim()}
          className="px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium"
        >
          Add
        </button>
      </form>
      {notes.length === 0 ? (
        <p className="text-sm text-fg-subtle">No activity yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="border-l-2 border-line pl-3">
              <p className="text-sm text-fg whitespace-pre-wrap">{note.body}</p>
              <p className="text-xs text-fg-subtle mt-0.5">
                {new Date(note.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
