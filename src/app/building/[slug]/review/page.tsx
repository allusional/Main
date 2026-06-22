import Link from "next/link";
import { notFound } from "next/navigation";
import { getBuildingBySlug } from "@/lib/data";

export default async function WriteReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const building = await getBuildingBySlug(slug);
  if (!building) notFound();

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold">Review {building.name}</h1>
      <p className="mt-3 text-sm text-black/60 dark:text-white/60">
        The structured review form (per-category ratings, pros &amp; cons,
        tenure) arrives in Phase 3, along with submission and moderation. For now
        you can sign in to get ready.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/auth/signin"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Sign in
        </Link>
        <Link
          href={`/building/${building.slug}`}
          className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium dark:border-white/15"
        >
          Back to building
        </Link>
      </div>
    </main>
  );
}
