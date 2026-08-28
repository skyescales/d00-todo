export default function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-surface border border-line rounded-xl p-4">
      <p className="text-xs font-medium text-fg-muted uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-fg mt-1">{value}</p>
      {sub && <p className="text-xs text-fg-subtle mt-1">{sub}</p>}
    </div>
  );
}
