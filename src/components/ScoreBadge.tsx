// Color-coded overall score (out of 5).
function colorFor(score: number): string {
  if (score >= 4.3) return "bg-green-600 text-white";
  if (score >= 3.5) return "bg-lime-500 text-black";
  if (score >= 2.5) return "bg-amber-500 text-black";
  if (score > 0) return "bg-red-500 text-white";
  return "bg-black/10 text-black/50 dark:bg-white/10 dark:text-white/50";
}

export function ScoreBadge({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-9 w-9 text-sm",
    md: "h-12 w-12 text-base",
    lg: "h-16 w-16 text-2xl",
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl font-semibold tabular-nums ${colorFor(
        score,
      )} ${sizes[size]}`}
      title={`${score} out of 5`}
    >
      {score > 0 ? score.toFixed(1) : "—"}
    </span>
  );
}
