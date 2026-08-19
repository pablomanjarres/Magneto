import type { MarketGap } from "@moonlight/types";

/**
 * The differentiator, on screen: skills measured against the whole vacancy set
 * rather than one offer, so the candidate closes the gap that unlocks the most.
 */
export function MarketGaps({ gaps, limit = 6 }: { gaps: MarketGap[]; limit?: number }) {
  if (gaps.length === 0) {
    return <p className="lead">Nothing. Every skill the dataset asks for is already on the profile.</p>;
  }

  return (
    <ol className="stack" style={{ gap: 10, listStyle: "none", margin: 0, padding: 0 }}>
      {gaps.slice(0, limit).map((gap) => (
        <li key={gap.skill} className="stack" style={{ gap: 6 }}>
          <div className="split">
            <span style={{ fontSize: 13.5 }}>{gap.skill}</span>
            <span className="meta num">
              {gap.demandCount} {gap.demandCount === 1 ? "vacancy" : "vacancies"} · {gap.sharePercent}%
            </span>
          </div>
          <div className="track" style={{ height: 6 }}>
            <div className="track__fill" style={{ width: `${gap.sharePercent}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
