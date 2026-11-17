import Link from "next/link";
import type { ScoreResult, Vacancy } from "@moonlight/types";
import { topGaps } from "@moonlight/core";

import { placeMeta, salaryRange } from "../lib/format";
import { Chip, Score, liftCard } from "./primitives";
import { Icon } from "./Icon";

/**
 * One scored vacancy as a card. The dashboard's top matches and the full
 * vacancy list are the same card, so it lives here and not in either page.
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

  return (
    <Link
      href={`/jobs/${vacancy.id}`}
      className={`group flex gap-5 rounded-3xl border border-line bg-canvas p-5 ${liftCard}`}
    >
      <div className="flex w-16 shrink-0 items-center justify-center border-r border-line pr-5">
        <Score score={unscored ? null : result.score} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[17px] font-bold text-ink group-hover:text-brand">
            {vacancy.title}
          </span>
          {applied && <Chip tone="met">Postulado</Chip>}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
          <span className="flex items-center gap-1.5">
            <Icon name="building" size={14} />
            {vacancy.company}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="mapPin" size={14} />
            {placeMeta(vacancy)}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="money" size={14} />
            {salaryRange(vacancy)}
          </span>
        </div>
        <p className="text-sm text-slate">
          {unscored ? "Agrega tus habilidades para ver cuánto encajas." : result.reason}
        </p>
        {!unscored && gaps.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {gaps.map((m) => (
              <Chip key={m.skill} tone="missing">
                {m.skill}
              </Chip>
            ))}
            {more > 0 && <span className="text-xs text-muted">+{more} más</span>}
          </div>
        )}
      </div>

      <Icon name="chevronRight" size={20} />
    </Link>
  );
}
