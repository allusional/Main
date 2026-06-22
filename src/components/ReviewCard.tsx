import { ScoreBadge } from "@/components/ScoreBadge";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
  });
}

export function ReviewCard({
  title,
  body,
  author,
  overall,
  createdAt,
  pros,
  cons,
  meta,
}: {
  title: string;
  body: string;
  author: string;
  overall: number;
  createdAt: string;
  pros?: string;
  cons?: string;
  meta?: string;
}) {
  return (
    <article className="rounded-xl border border-black/10 p-4 dark:border-white/10">
      <div className="flex items-start gap-3">
        <ScoreBadge score={overall} size="sm" />
        <div className="min-w-0 flex-1">
          <h4 className="font-medium">{title}</h4>
          <p className="text-xs text-black/50 dark:text-white/50">
            {author} · {formatDate(createdAt)}
            {meta ? ` · ${meta}` : ""}
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm text-black/80 dark:text-white/80">{body}</p>

      {(pros || cons) && (
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {pros && (
            <p className="rounded-lg bg-green-50 p-2 text-green-900 dark:bg-green-950 dark:text-green-200">
              <span className="font-medium">Pros: </span>
              {pros}
            </p>
          )}
          {cons && (
            <p className="rounded-lg bg-red-50 p-2 text-red-900 dark:bg-red-950 dark:text-red-200">
              <span className="font-medium">Cons: </span>
              {cons}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
