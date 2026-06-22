import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-8 px-6 py-20 text-center">
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

      {/* Search is wired up in Phase 2. */}
      <form
        action="/search"
        className="flex w-full max-w-md items-center gap-2"
      >
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
    </main>
  );
}
