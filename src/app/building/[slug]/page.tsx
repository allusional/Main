import Link from "next/link";
import { notFound } from "next/navigation";
import {
  allBuildingSlugs,
  buildingDimensionAverages,
  buildingOverall,
  BUILDING_DIMENSIONS,
  BUILDING_TYPE_LABELS,
  getBuildingBySlug,
  getCompanyBySlug,
} from "@/lib/data";
import { ScoreBadge } from "@/components/ScoreBadge";
import { ScoreBar } from "@/components/ScoreBar";
import { ReviewCard } from "@/components/ReviewCard";
import { MapEmbed } from "@/components/MapEmbed";

export async function generateStaticParams() {
  return (await allBuildingSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const building = await getBuildingBySlug(slug);
  if (!building) return {};
  const score = buildingOverall(building.reviews);
  return {
    title: `${building.name} reviews`,
    description: `${building.name} in ${building.city} — rated ${score}/5 across ${building.reviews.length} resident reviews on management, noise, amenities, and more.`,
  };
}

function factList(building: Awaited<ReturnType<typeof getBuildingBySlug>>) {
  if (!building) return [];
  return [
    ["Type", BUILDING_TYPE_LABELS[building.buildingType]],
    building.yearBuilt && ["Year built", String(building.yearBuilt)],
    building.numUnits && ["Units", String(building.numUnits)],
    building.numFloors && ["Floors", String(building.numFloors)],
    building.developer && ["Developer", building.developer],
  ].filter(Boolean) as [string, string][];
}

export default async function BuildingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const building = await getBuildingBySlug(slug);
  if (!building) notFound();

  const overall = buildingOverall(building.reviews);
  const averages = buildingDimensionAverages(building.reviews);
  const company = building.companySlug
    ? await getCompanyBySlug(building.companySlug)
    : null;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <ScoreBadge score={overall} size="lg" />
          <div>
            <h1 className="text-2xl font-semibold">{building.name}</h1>
            <p className="text-sm text-black/60 dark:text-white/60">
              {building.address}, {building.city}
              {building.postalCode ? ` ${building.postalCode}` : ""}
            </p>
            <p className="mt-1 text-sm text-black/50 dark:text-white/50">
              {building.reviews.length} review
              {building.reviews.length === 1 ? "" : "s"}
              {company && (
                <>
                  {" · Managed by "}
                  <Link
                    href={`/company/${company.slug}`}
                    className="underline underline-offset-2"
                  >
                    {company.name}
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
        <Link
          href={`/building/${building.slug}/review`}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Write a review
        </Link>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1fr]">
        {/* Ratings breakdown */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
            Rating breakdown
          </h2>
          <div className="space-y-3">
            {BUILDING_DIMENSIONS.map((d) => (
              <ScoreBar key={d.key} label={d.label} value={averages[d.key]} />
            ))}
          </div>
        </section>

        {/* Facts + map + amenities */}
        <section className="space-y-6">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
              About
            </h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              {factList(building).map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-black/55 dark:text-white/55">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <MapEmbed
            lat={building.lat}
            lng={building.lng}
            label={building.name}
            className="aspect-video"
          />

          {building.amenities.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
                Amenities
              </h2>
              <ul className="flex flex-wrap gap-2">
                {building.amenities.map((a) => (
                  <li
                    key={a}
                    className="rounded-full bg-black/5 px-3 py-1 text-xs dark:bg-white/10"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {/* Reviews */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Resident reviews</h2>
        <div className="space-y-4">
          {building.reviews.map((r) => (
            <ReviewCard
              key={r.id}
              title={r.title}
              body={r.body}
              author={r.author}
              overall={buildingOverall([r])}
              createdAt={r.createdAt}
              pros={r.pros}
              cons={r.cons}
              meta={[r.unitType, r.tenure].filter(Boolean).join(" · ") || undefined}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
