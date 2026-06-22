import Link from "next/link";
import { notFound } from "next/navigation";
import { BUILDING_DIMENSIONS, getBuildingBySlug } from "@/lib/data";
import { ReviewForm } from "@/components/ReviewForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const building = await getBuildingBySlug(slug);
  return { title: building ? `Review ${building.name}` : "Write a review" };
}

export default async function WriteReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const building = await getBuildingBySlug(slug);
  if (!building) notFound();

  const costLabel =
    building.buildingType === "CONDO" ? "Maintenance fee" : "Rent";

  // Hide the concierge rating entirely for buildings without one; other optional
  // dimensions keep their N/A option.
  const hasConcierge = building.amenities.includes("Concierge");
  const dimensions = BUILDING_DIMENSIONS.filter(
    (d) => d.key !== "concierge" || hasConcierge,
  ).map((d) => ({ key: d.key, label: d.label, optional: d.optional }));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="mb-6">
        <Link
          href={`/building/${building.slug}`}
          className="text-sm text-black/55 underline dark:text-white/55"
        >
          ← {building.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Write a review</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Share your experience living at {building.name} to help the next person
          deciding whether to move in.
        </p>
      </div>

      <ReviewForm
        buildingName={building.name}
        buildingSlug={building.slug}
        costLabel={costLabel}
        dimensions={dimensions}
      />
    </main>
  );
}
