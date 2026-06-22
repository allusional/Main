"use client";

import { useRouter } from "next/navigation";
import { ALL_AMENITIES, BUILDING_TYPE_LABELS, type BuildingType } from "@/lib/data";

export interface SearchState {
  q: string;
  type: "" | BuildingType;
  minScore: string;
  amenities: string[];
}

export function SearchControls({ initial }: { initial: SearchState }) {
  const router = useRouter();

  function apply(form: HTMLFormElement) {
    const data = new FormData(form);
    const params = new URLSearchParams();

    const q = (data.get("q") as string)?.trim();
    const type = data.get("type") as string;
    const minScore = data.get("minScore") as string;
    const amenities = data.getAll("amenities") as string[];

    if (q) params.set("q", q);
    if (type) params.set("type", type);
    if (minScore) params.set("minScore", minScore);
    for (const a of amenities) params.append("amenity", a);

    router.push(`/search${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply(e.currentTarget);
      }}
      onChange={(e) => apply(e.currentTarget)}
      className="flex flex-col gap-4 rounded-xl border border-black/10 p-4 dark:border-white/10"
    >
      <input
        name="q"
        defaultValue={initial.q}
        placeholder="Building name or address…"
        className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
      />

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-black/60 dark:text-white/60">
          Type
          <select
            name="type"
            defaultValue={initial.type}
            className="rounded-lg border border-black/15 px-2 py-2 text-sm dark:border-white/15"
          >
            <option value="">Any</option>
            {(Object.keys(BUILDING_TYPE_LABELS) as BuildingType[]).map((t) => (
              <option key={t} value={t}>
                {BUILDING_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-black/60 dark:text-white/60">
          Min score
          <select
            name="minScore"
            defaultValue={initial.minScore}
            className="rounded-lg border border-black/15 px-2 py-2 text-sm dark:border-white/15"
          >
            <option value="">Any</option>
            <option value="3">3.0+</option>
            <option value="3.5">3.5+</option>
            <option value="4">4.0+</option>
          </select>
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs text-black/60 dark:text-white/60">Amenities</legend>
        <div className="flex flex-wrap gap-2">
          {ALL_AMENITIES.map((a) => {
            const checked = initial.amenities.includes(a);
            return (
              <label
                key={a}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-black/15 px-2.5 py-1 text-xs has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-background dark:border-white/15"
              >
                <input
                  type="checkbox"
                  name="amenities"
                  value={a}
                  defaultChecked={checked}
                  className="sr-only"
                />
                {a}
              </label>
            );
          })}
        </div>
      </fieldset>
    </form>
  );
}
