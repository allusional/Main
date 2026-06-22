type SearchParams = Promise<{ q?: string }>;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      <h1 className="text-2xl font-semibold">
        {q ? `Search: “${q}”` : "Search buildings"}
      </h1>
      <p className="mt-3 text-sm text-black/60 dark:text-white/60">
        Building search and the map view land in Phase 2. For now this is a
        placeholder that confirms routing and query params work.
      </p>
    </main>
  );
}
