// Horizontal bar for a single rating dimension (value out of 5). A null/undefined
// value renders as "N/A" (e.g. concierge in a building without one).
export function ScoreBar({
  label,
  value,
}: {
  label: string;
  value: number | null | undefined;
}) {
  const hasValue = typeof value === "number" && value > 0;
  const pct = hasValue ? Math.max(0, Math.min(100, (value / 5) * 100)) : 0;
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
      <span className="text-sm text-black/70 dark:text-white/70">{label}</span>
      <span className="text-sm font-medium tabular-nums">
        {hasValue ? value.toFixed(1) : "N/A"}
      </span>
      <div className="col-span-2 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-foreground/80"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
