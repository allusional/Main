import { notFound } from "next/navigation";
import {
  allCompanySlugs,
  companyDimensionAverages,
  companyManagementAcrossBuildings,
  companyOverall,
  COMPANY_DIMENSIONS,
  getCompanyBuildings,
  getCompanyBySlug,
} from "@/lib/data";
import { ScoreBadge } from "@/components/ScoreBadge";
import { ScoreBar } from "@/components/ScoreBar";
import { ReviewCard } from "@/components/ReviewCard";
import { BuildingCard } from "@/components/BuildingCard";

export async function generateStaticParams() {
  return (await allCompanySlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) return {};
  return {
    title: `${company.name} reviews`,
    description: `Resident reviews of property manager ${company.name} across the buildings they operate in the Greater Toronto Area.`,
  };
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const overall = companyOverall(company.reviews);
  const averages = companyDimensionAverages(company.reviews);
  const buildings = await getCompanyBuildings(slug);
  const portfolio = await companyManagementAcrossBuildings(slug);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="flex items-start gap-4">
        <ScoreBadge score={overall} size="lg" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
            Property management company
          </p>
          <h1 className="text-2xl font-semibold">{company.name}</h1>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            {company.reviews.length} company review
            {company.reviews.length === 1 ? "" : "s"} · manages{" "}
            {portfolio.buildingCount} building
            {portfolio.buildingCount === 1 ? "" : "s"} in the GTA
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1fr]">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
            Rating breakdown
          </h2>
          <div className="space-y-3">
            {COMPANY_DIMENSIONS.map((d) => (
              <ScoreBar key={d.key} label={d.label} value={averages[d.key]} />
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
            Across their portfolio
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <ScoreBadge score={portfolio.score} />
            <p className="text-sm text-black/70 dark:text-white/70">
              Average <strong>management</strong> rating residents give the
              buildings this company operates.
            </p>
          </div>
        </section>
      </div>

      {buildings.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Buildings they manage</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {buildings.map((b) => (
              <BuildingCard key={b.slug} building={b} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Company reviews</h2>
        <div className="space-y-4">
          {company.reviews.map((r) => (
            <ReviewCard
              key={r.id}
              title={r.title}
              body={r.body}
              author={r.author}
              overall={companyOverall([r])}
              createdAt={r.createdAt}
              meta={r.buildingName}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
