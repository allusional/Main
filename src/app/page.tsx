import Link from "next/link";
import { getTopBuildings } from "@/lib/data";
import { BuildingCard } from "@/components/BuildingCard";

export default async function Home() {
  const top = await getTopBuildings(4);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-6 py-16">
      <section className="flex flex-col items-center gap-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Know the building before you move in.
          </h1>
          <p className="mx-auto max-w-xl text-balance text-black/60 dark:text-white/60">
            Honest, resident-written reviews of condos and apartments across the
            Greater Toronto Area — management, noise, amenities, maintenance,
            safety, and value, all in one place.
          </p>
        </div>

        <form action="/search" className="flex w-full max-w-md items-center gap-2">
          <input
            name="q"
            placeholder="Search by building name or address…"
            className="flex-1 rounded-lg border border-black/15 px-4 py-2.5 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
          />
          <button
            type="submit"
            className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background"
          >
            Search
          </button>
        </form>

        <p className="text-sm text-black/50 dark:text-white/50">
          Lived somewhere in the GTA?{" "}
          <Link href="/auth/signin" className="underline">
            Sign in
          </Link>{" "}
          to write a review.
        </p>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Top-rated buildings</h2>
          <Link
            href="/search"
            className="text-sm text-black/60 underline dark:text-white/60"
          >
            Browse all
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {top.map((b) => (
            <BuildingCard key={b.slug} building={b} />
          ))}
        </div>
      </section>

      <p className="rounded-lg bg-black/5 px-4 py-3 text-center text-xs text-black/50 dark:bg-white/10 dark:text-white/50">
        Showing sample data for development. Real GTA buildings are imported in
        Phase 1.
      </p>
    </main>
  );
}
