"use client";

type Point = { date: string; count: number };

export default function TrendChart({ data }: { data: Point[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const width = 100;
  const height = 32;
  const stepX = data.length > 1 ? width / (data.length - 1) : width;

  const points = data
    .map((d, i) => {
      const x = i * stepX;
      const y = height - (d.count / max) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-24"
      >
        <polygon points={areaPoints} fill="rgb(50 139 255 / 0.12)" />
        <polyline
          points={points}
          fill="none"
          stroke="rgb(28 105 245)"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex justify-between text-[11px] text-slate-400 mt-1">
        <span>{formatDate(data[0]?.date)}</span>
        <span>{formatDate(data[data.length - 1]?.date)}</span>
      </div>
    </div>
  );
}

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
