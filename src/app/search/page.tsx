import Link from "next/link";
import { listBuildings, type BuildingType } from "@/lib/data";
import { BuildingCard } from "@/components/BuildingCard";
import { SearchControls, type SearchState } from "@/components/SearchControls";
import { MapEmbed } from "@/components/MapEmbed";

export const metadata = {
  title: "Search buildings",
};

type SearchParams = Promise<{
  q?: string;
  type?: string;
  minScore?: string;
  amenity?: string | string[];
}>;

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const amenities = asArray(sp.amenity);
  const type = (sp.type as BuildingType) || undefined;
  const minScore = sp.minScore ? Number(sp.minScore) : undefined;

  const results = await listBuildings({ q: sp.q, type, amenities, minScore });

  const initial: SearchState = {
    q: sp.q ?? "",
    type: (sp.type as BuildingType) ?? "",
    minScore: sp.minScore ?? "",
    amenities,
  };

  // Center the map on the first result, else on downtown Toronto.
  const center = results[0] ?? { lat: 43.6532, lng: -79.3832, name: "Toronto" };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">Search buildings</h1>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        Greater Toronto Area · {results.length} result
        {results.length === 1 ? "" : "s"}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <SearchControls initial={initial} />
          <MapEmbed
            lat={center.lat}
            lng={center.lng}
            label={"name" in center ? center.name : undefined}
            zoomSpan={0.08}
            className="aspect-square"
          />
        </aside>

        <section className="space-y-3">
          {results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/15 p-8 text-center text-sm text-black/60 dark:border-white/15 dark:text-white/60">
              No buildings match those filters.{" "}
              <Link href="/search" className="underline">
                Clear filters
              </Link>
              .
            </div>
          ) : (
            results.map((b) => <BuildingCard key={b.slug} building={b} />)
          )}
        </section>
      </div>
    </main>
  );
}
