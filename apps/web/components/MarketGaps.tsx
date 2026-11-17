import type { MarketGap } from "@moonlight/types";

/**
 * The differentiator, on screen: skills measured against the whole vacancy set
 * rather than one offer, so the candidate closes the gap that unlocks the most.
 * Bars are ranked against the most asked-for skill, so the drop between skills
 * shows, and the count says "15 de 50" once instead of "15 · 30%".
 */
export function MarketGaps({
  gaps,
  total,
  limit = 6,
}: {
  gaps: MarketGap[];
  /** How many vacancies were counted. */
  total: number;
  limit?: number;
}) {
  if (gaps.length === 0) {
    return (
      <p className="text-sm text-muted">
        Ninguna. Tu perfil ya tiene cada habilidad que piden las vacantes.
      </p>
    );
  }

  const most = gaps[0]?.demandCount ?? 1;
  return (
    <ol className="flex flex-col gap-3.5">
      {gaps.slice(0, limit).map((gap, index) => (
        <li
          key={gap.skill}
          className="flex animate-rise flex-col gap-1.5"
          style={{ animationDelay: `${index * 70}ms` }}
        >
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className={`font-bold ${index === 0 ? "text-brand" : "text-ink"}`}>
              {gap.skill}
            </span>
            <span className="text-xs text-muted tabular-nums">
              {gap.demandCount} de {total} vacantes
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-brand-wash">
            <div
              className="h-full rounded-full bg-brand-soft"
              style={{ width: `${(gap.demandCount / most) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
