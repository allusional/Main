"use client";

import { useState } from "react";

// Controlled 1–5 star input. `value` of 0 means unset. When `allowNA` is set, an
// N/A button records the dimension as not-applicable (value -1).
export function StarRating({
  label,
  value,
  onChange,
  allowNA = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  allowNA?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const isNA = value === -1;

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-black/75 dark:text-white/75">{label}</span>
      <div className="flex items-center gap-1">
        <div onMouseLeave={() => setHover(0)} className="flex">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = !isNA && n <= (hover || value);
            return (
              <button
                key={n}
                type="button"
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                onMouseEnter={() => setHover(n)}
                onClick={() => onChange(n)}
                className={`px-0.5 text-xl leading-none transition-colors ${
                  active
                    ? "text-amber-500"
                    : "text-black/20 dark:text-white/25"
                }`}
              >
                ★
              </button>
            );
          })}
        </div>
        {allowNA && (
          <button
            type="button"
            onClick={() => onChange(isNA ? 0 : -1)}
            className={`ml-1 rounded px-1.5 py-0.5 text-xs ${
              isNA
                ? "bg-foreground text-background"
                : "text-black/45 hover:bg-black/5 dark:text-white/45 dark:hover:bg-white/10"
            }`}
          >
            N/A
          </button>
        )}
      </div>
    </div>
  );
}
