import type { ReactNode } from "react";

/**
 * Vacancies the way magneto365 lists search results: a lavender bar with the
 * title and the count, over flat rows. The dashboard's top matches and /jobs
 * both use it, so a row looks the same in either place.
 */
export function VacancyListPanel({
  heading: Heading = "h2",
  title,
  count,
  extra,
  action,
  children,
}: {
  heading?: "h1" | "h2";
  title: string;
  count?: string | undefined;
  /** Beside the count, such as a help toggle. */
  extra?: ReactNode;
  /** At the right end of the bar, such as the sort order. */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-canvas">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-brand-wash px-5 py-3">
        <Heading className="text-[15px] font-bold text-ink">{title}</Heading>
        {count && (
          <span className="text-sm text-ink tabular-nums sm:border-l sm:border-ink/20 sm:pl-3">
            {count}
          </span>
        )}
        {extra}
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </section>
  );
}
