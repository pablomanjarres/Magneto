import Link from "next/link";
import type { ScoreResult, Vacancy } from "@moonlight/types";
import { topGaps } from "@moonlight/core";

import { salaryRange, vacancyMeta } from "../lib/format";
import { Chip, Score } from "./primitives";

/**
 * One scored vacancy as a row. The dashboard's top matches and the full
 * vacancy list are the same row, so it lives here and not in either page.
 */
export function VacancyRow({
  vacancy,
  result,
  applied = false,
}: {
  vacancy: Vacancy;
  result: ScoreResult;
  applied?: boolean;
}) {
  // A summary, not the detail: the top three gaps here, the rest on /jobs/[id].
  const gaps = topGaps(result);
  const more = result.missing.length - gaps.length;

  return (
    <Link href={`/jobs/${vacancy.id}`} className="card row" style={{ gap: 18, color: "inherit" }}>
      <Score score={result.score} />
      <div className="divider" />

      <div className="stack grow" style={{ gap: 5 }}>
        <div className="row" style={{ gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 500 }}>{vacancy.title}</span>
          {applied && <Chip tone="met">Applied</Chip>}
        </div>
        <span className="meta" style={{ color: "var(--muted)" }}>
          {vacancyMeta(vacancy)} · {salaryRange(vacancy)}
        </span>
        <p className="lead">{result.reason}</p>
        {gaps.length > 0 && (
          <div className="chips" style={{ paddingTop: 2 }}>
            {gaps.map((m) => (
              <Chip key={m.skill} tone="missing">
                {m.skill}
              </Chip>
            ))}
            {more > 0 && <span className="meta">+{more} more</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
