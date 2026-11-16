import type { MarketGap } from "@moonlight/types";

/**
 * The differentiator, on screen: skills measured against the whole vacancy set
 * rather than one offer, so the candidate closes the gap that unlocks the most.
 */
export function MarketGaps({ gaps, limit = 6 }: { gaps: MarketGap[]; limit?: number }) {
  if (gaps.length === 0) {
    return (
      <p className="text-sm text-muted">
        Ninguna. Tu perfil ya tiene cada habilidad que piden las vacantes.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-3.5">
      {gaps.slice(0, limit).map((gap, index) => (
        <li
          key={gap.skill}
          className="flex animate-rise flex-col gap-1.5"
          style={{ animationDelay: `${index * 70}ms` }}
        >
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-bold text-ink">{gap.skill}</span>
            <span className="text-xs text-muted tabular-nums">
              {gap.demandCount} {gap.demandCount === 1 ? "vacante" : "vacantes"} ·{" "}
              {gap.sharePercent}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-strong">
            <div
              className="h-full rounded-full bg-brand-soft"
              style={{ width: `${gap.sharePercent}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
