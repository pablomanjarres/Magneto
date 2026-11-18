import Link from "next/link";
import type { Application, ScoreResult, Vacancy } from "@moonlight/types";

import { Icon } from "../../components/Icon";
import { Score } from "../../components/primitives";
import { placeMeta, salaryRange } from "../../lib/format";
import { ApplyButton } from "./[id]/ApplyButton";
import { KIND_LABELS } from "./[id]/ScoreBreakdown";

/**
 * The vacancy picked in the list, opened beside it the way magneto365 shows an
 * offer next to its results: who and where, the apply button, then what it
 * asks for, ticked against the profile. Narrow screens open /jobs/[id] instead.
 */
export function VacancyPreview({
  vacancy,
  result,
  profileId,
  application,
  unscored,
}: {
  vacancy: Vacancy;
  result: ScoreResult;
  profileId: string;
  application?: Application | undefined;
  /** No skills yet: nothing can be ticked, and applying waits, as on /jobs/[id]. */
  unscored: boolean;
}) {
  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="grid size-14 shrink-0 place-items-center rounded-2xl border border-line bg-brand-wash text-xl font-black text-brand"
        >
          {vacancy.company.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-balance text-slate">{vacancy.title}</h2>
          <p className="text-sm text-slate">
            <span className="font-bold text-brand">{vacancy.company}</span> · {placeMeta(vacancy)}
          </p>
          <p className="text-sm text-muted tabular-nums">{salaryRange(vacancy)}</p>
          <Link
            href={`/jobs/${vacancy.id}`}
            className="mt-1.5 inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline"
          >
            Ver la vacante completa
            <Icon name="arrowRight" size={14} strokeWidth={2.4} />
          </Link>
        </div>
        {!unscored && <Score score={result.score} />}
      </div>

      {!unscored && (
        <div className="border-b border-line pb-5">
          <ApplyButton profileId={profileId} vacancyId={vacancy.id} application={application} />
        </div>
      )}

      <div className="rounded-2xl bg-surface p-5">
        <h3 className="font-bold text-ink">Requisitos para aplicar a la vacante:</h3>
        <ul className="mt-3 flex flex-col gap-2.5 text-sm text-ink">
          {result.breakdown.map((line) => (
            <li key={line.skill} className="flex items-center gap-2.5">
              {unscored ? (
                <span aria-hidden="true" className="mx-1.5 size-1.5 rounded-full bg-control" />
              ) : (
                <span className={line.met ? "text-mint-deep" : "text-danger"}>
                  <Icon name={line.met ? "check" : "close"} size={15} strokeWidth={3} />
                  <span className="sr-only">{line.met ? "Lo tienes:" : "Te falta:"}</span>
                </span>
              )}
              <span className="min-w-0 flex-1">{line.skill}</span>
              <span className="text-xs text-muted">{KIND_LABELS[line.kind]}</span>
            </li>
          ))}
          {result.location && (
            <li className="flex items-center gap-2.5 text-danger">
              <Icon name="mapPin" size={15} />
              <span className="min-w-0 flex-1">
                Fuera de tu ciudad ({result.location.city}) y no te reubicas
              </span>
              <span className="text-xs font-bold tabular-nums">−{result.location.points}</span>
            </li>
          )}
        </ul>
      </div>

      <p className="text-sm text-pretty text-slate">
        {unscored ? "Agrega tus habilidades para ver cuánto encajas." : result.reason}
      </p>
    </div>
  );
}
