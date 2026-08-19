import Link from "next/link";
import type { ScoreResult, Vacancy } from "@moonlight/types";

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
        {result.missing.length > 0 && (
          <div className="chips" style={{ paddingTop: 2 }}>
            {result.missing.map((m) => (
              <Chip key={m.skill} tone="missing">
                {m.skill}
              </Chip>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
