"use client";

import { useState } from "react";
import Papa from "papaparse";
import { mapCsvRow, IMPORT_TEMPLATE_HEADERS, type ImportRow } from "@/lib/csv";

type ImportResult = {
  total: number;
  inserted: number;
  skippedDuplicates: { businessName: string; city: string }[];
  errors: { row: number; message: string }[];
};

export default function BulkImportModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const [csvText, setCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function parse(text: string) {
    setCsvText(text);
    if (!text.trim()) {
      setParsedRows([]);
      setParseErrors([]);
      return;
    }
    const { data } = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });

    const rows: ImportRow[] = [];
    const errors: string[] = [];
    data.forEach((raw, i) => {
      const { row, error } = mapCsvRow(raw);
      if (error || !row) {
        errors.push(`Row ${i + 2}: ${error}`);
      } else {
        rows.push(row);
      }
    });
    setParsedRows(rows);
    setParseErrors(errors);
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => parse(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  async function submit() {
    setImporting(true);
    const res = await fetch("/api/leads/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: parsedRows }),
    });
    setImporting(false);
    if (!res.ok) return;
    const data = await res.json();
    setResult(data);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Bulk Import Leads</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!result ? (
            <>
              <p className="text-sm text-slate-500">
                Paste CSV text below, or upload a file. Expected columns (order flexible, case-insensitive):
              </p>
              <p className="text-xs text-slate-400 bg-slate-50 rounded-lg p-2 font-mono">
                {IMPORT_TEMPLATE_HEADERS.join(", ")}
              </p>

              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
                className="text-sm"
              />

              <textarea
                value={csvText}
                onChange={(e) => parse(e.target.value)}
                rows={8}
                placeholder="Business Name,City,Website URL,Instagram,Phone,..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              />

              {parseErrors.length > 0 && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  {parseErrors.map((e, i) => (
                    <div key={i}>{e}</div>
                  ))}
                </div>
              )}

              <p className="text-sm text-slate-600">
                {parsedRows.length} row{parsedRows.length === 1 ? "" : "s"} ready to import.
              </p>

              <div className="flex items-center gap-3">
                <button
                  disabled={!parsedRows.length || importing}
                  onClick={submit}
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium"
                >
                  {importing ? "Importing…" : `Import ${parsedRows.length} leads`}
                </button>
                <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-700">
                Imported <strong>{result.inserted}</strong> of {result.total} rows.
              </p>
              {result.skippedDuplicates.length > 0 && (
                <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
                  <p className="font-medium mb-1">Skipped {result.skippedDuplicates.length} duplicate(s):</p>
                  {result.skippedDuplicates.map((d, i) => (
                    <div key={i}>
                      {d.businessName} — {d.city}
                    </div>
                  ))}
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="text-xs text-red-600 bg-red-50 rounded-lg p-2">
                  {result.errors.map((e, i) => (
                    <div key={i}>
                      Row {e.row}: {e.message}
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={onImported}
                className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
