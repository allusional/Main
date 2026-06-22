"use client";

import { useState } from "react";
import Link from "next/link";
import { StarRating } from "@/components/StarRating";

export interface DimensionField {
  key: string;
  label: string;
  optional?: boolean;
}

export function ReviewForm({
  buildingName,
  buildingSlug,
  costLabel,
  dimensions,
}: {
  buildingName: string;
  buildingSlug: string;
  costLabel: string;
  dimensions: DimensionField[];
}) {
  const [overall, setOverall] = useState(0);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [unitType, setUnitType] = useState("");
  const [tenure, setTenure] = useState("");
  const [monthlyCost, setMonthlyCost] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  function setRating(key: string, v: number) {
    setRatings((r) => ({ ...r, [key]: v }));
  }

  function validate(): string[] {
    const errs: string[] = [];
    if (overall < 1) errs.push("Give an overall rating.");
    if (title.trim().length < 4) errs.push("Add a short title.");
    if (body.trim().length < 20) errs.push("Write at least a sentence or two.");
    for (const d of dimensions) {
      const v = ratings[d.key] ?? 0;
      // Required dimensions need a 1–5 score; optional ones may be unset or N/A (-1).
      if (!d.optional && v < 1) errs.push(`Rate “${d.label}”.`);
    }
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (errs.length === 0) setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-950">
        <h2 className="text-lg font-semibold text-green-900 dark:text-green-100">
          Thanks — your review is ready to submit.
        </h2>
        <p className="mt-2 text-sm text-green-800 dark:text-green-200">
          In the live app this would go to the moderation queue (Phase 4) and be
          saved to your account once auth and the database are wired up
          (Phase&nbsp;1/3). Nothing is persisted in this preview.
        </p>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-green-900 dark:text-green-100">
          <dt className="opacity-70">Overall</dt>
          <dd>{overall}/5</dd>
          {dimensions.map((d) => {
            const v = ratings[d.key] ?? 0;
            return (
              <div key={d.key} className="contents">
                <dt className="opacity-70">{d.label}</dt>
                <dd>{v === -1 ? "N/A" : v > 0 ? `${v}/5` : "—"}</dd>
              </div>
            );
          })}
          {monthlyCost && (
            <div className="contents">
              <dt className="opacity-70">{costLabel}</dt>
              <dd>${Number(monthlyCost).toLocaleString()}/mo</dd>
            </div>
          )}
        </dl>
        <div className="mt-5">
          <Link
            href={`/building/${buildingSlug}`}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Back to {buildingName}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Overall */}
      <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <StarRating label="Overall rating" value={overall} onChange={setOverall} />
      </section>

      {/* Subratings */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
          Rate the details
        </h2>
        <div className="space-y-3 rounded-xl border border-black/10 p-4 dark:border-white/10">
          {dimensions.map((d) => (
            <StarRating
              key={d.key}
              label={d.optional ? `${d.label} (optional)` : d.label}
              value={ratings[d.key] ?? 0}
              onChange={(v) => setRating(d.key, v)}
              allowNA={d.optional}
            />
          ))}
        </div>
      </section>

      {/* Written review */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
          Your review
        </h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title — sum it up in a few words"
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder="What was it like to live here? Management, noise, the building itself…"
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={pros}
            onChange={(e) => setPros(e.target.value)}
            placeholder="Pros (optional)"
            className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
          />
          <input
            value={cons}
            onChange={(e) => setCons(e.target.value)}
            placeholder="Cons (optional)"
            className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
          />
        </div>
      </section>

      {/* Context + cost capture */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
          Your unit (optional)
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            value={unitType}
            onChange={(e) => setUnitType(e.target.value)}
            placeholder="Unit type, e.g. 1 bed + den"
            className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
          />
          <input
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
            placeholder="When, e.g. 2021–present"
            className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
          />
          <label className="flex items-center rounded-lg border border-black/15 px-3 text-sm dark:border-white/15">
            <span className="text-black/45 dark:text-white/45">$</span>
            <input
              type="number"
              min={0}
              value={monthlyCost}
              onChange={(e) => setMonthlyCost(e.target.value)}
              placeholder={`${costLabel}/mo`}
              className="w-full bg-transparent px-1 py-2 outline-none"
            />
          </label>
        </div>
        <p className="text-xs text-black/50 dark:text-white/50">
          Your {costLabel.toLowerCase()} stays anonymous — we only show an
          aggregated range across residents.
        </p>
      </section>

      {errors.length > 0 && (
        <ul className="space-y-1 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {errors.map((er) => (
            <li key={er}>• {er}</li>
          ))}
        </ul>
      )}

      <button
        type="submit"
        className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background"
      >
        Submit review
      </button>
    </form>
  );
}
