import Link from "next/link";
import type { ScoreResult, Vacancy } from "@moonlight/types";
import { topGaps } from "@moonlight/core";

import { cityName, salaryRange, workModeLabel } from "../lib/format";
import { Chip, Score } from "./primitives";

/**
 * One scored vacancy as a row of a results list, laid out like magneto365's:
 * the title, then company and work mode, salary and city as plain lines, with
 * the match on the right. It has no border of its own and sits in
 * VacancyListPanel; the dashboard's top matches and /jobs share it.
 */
export function VacancyRow({
  vacancy,
  result,
  applied = false,
  unscored = false,
}: {
  vacancy: Vacancy;
  result: ScoreResult;
  applied?: boolean;
  /** The profile has no skills yet, so every score would be 0: none is shown. */
  unscored?: boolean;
}) {
  // A summary, not the detail: the top three gaps here, the rest on /jobs/[id].
  const gaps = topGaps(result);
  const more = result.missing.length - gaps.length;
  const city = cityName(vacancy);

  return (
    <Link
      href={`/jobs/${vacancy.id}`}
      className="group flex gap-4 px-5 py-4 outline-none transition-colors hover:bg-ink/[0.04] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-inset"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm text-slate">
        <p className="flex flex-wrap items-center gap-2">
          <span className="text-base font-bold text-slate group-hover:text-brand">
            {vacancy.title}
          </span>
          {applied && <Chip tone="met">Postulado</Chip>}
        </p>
        <p>
          {vacancy.company} | {workModeLabel(vacancy.workMode)}
        </p>
        <p className="tabular-nums">{salaryRange(vacancy)}</p>
        {city && <p>{city}</p>}
        {unscored ? (
          <p className="pt-1 text-muted">Agrega tus habilidades para ver cuánto encajas.</p>
        ) : (
          gaps.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
              {gaps.map((m) => (
                <Chip key={m.skill} tone="missing">
                  {m.skill}
                </Chip>
              ))}
              {more > 0 && <span className="text-xs text-muted">+{more} más</span>}
            </div>
          )
        )}
      </div>

      <div className="flex w-16 shrink-0 justify-center pt-0.5">
        <Score score={unscored ? null : result.score} />
      </div>
    </Link>
  );
}
