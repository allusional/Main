import Link from "next/link";
import { BUILDING_TYPE_LABELS, type BuildingSummary } from "@/lib/data";
import { ScoreBadge } from "@/components/ScoreBadge";

export function BuildingCard({ building }: { building: BuildingSummary }) {
  return (
    <Link
      href={`/building/${building.slug}`}
      className="flex items-start gap-4 rounded-xl border border-black/10 p-4 transition-colors hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
    >
      <ScoreBadge score={building.overall} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium">{building.name}</h3>
        <p className="truncate text-sm text-black/60 dark:text-white/60">
          {building.address}, {building.city}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-black/50 dark:text-white/50">
          <span className="rounded-full bg-black/5 px-2 py-0.5 dark:bg-white/10">
            {BUILDING_TYPE_LABELS[building.buildingType]}
          </span>
          <span>
            {building.reviewCount} review{building.reviewCount === 1 ? "" : "s"}
          </span>
          {building.companyName && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">Managed by {building.companyName}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
