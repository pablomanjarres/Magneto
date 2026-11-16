import type { RequirementKind, ScoreResult } from "@moonlight/types";
import { LOCATION_DEDUCTION, WEIGHTS, scoreFromWeights } from "@moonlight/core";

import { Icon } from "../../../components/Icon";
import { Card, EmptyState } from "../../../components/primitives";

export const KIND_LABELS: Record<RequirementKind, string> = {
  "must-have": "Obligatorio",
  "nice-to-have": "Deseable",
};

/** The score line by line: what the vacancy asks for, and what you bring to it. */
export function ScoreBreakdown({
  result,
  earned,
  total,
}: {
  result: ScoreResult;
  earned: number;
  total: number;
}) {
  if (result.breakdown.length === 0) {
    return (
      <EmptyState title="Esta vacante no lista requisitos">
        No hay nada contra qué comparar tus habilidades, así que el puntaje queda en cero y la
        vacante sale del ranking.
      </EmptyState>
    );
  }

  return (
    <Card className="flex animate-rise flex-col gap-5 p-6 [animation-delay:150ms]">
      <div>
        <h2 className="text-xl font-black text-slate">Por qué tienes {result.score}%</h2>
        <p className="mt-1 text-sm text-muted">{result.reason}</p>
      </div>

      <ul className="flex flex-col gap-2">
        {result.breakdown.map((line) => (
          <li
            key={line.skill}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${line.met ? "bg-mint-wash" : "bg-danger-wash"}`}
          >
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-full text-white ${line.met ? "bg-mint-deep" : "bg-danger"}`}
            >
              <Icon name={line.met ? "check" : "close"} size={14} strokeWidth={3} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-ink">{line.skill}</span>
              <span className={`text-xs font-bold ${line.met ? "text-mint-deep" : "text-danger"}`}>
                {line.met ? "Lo tienes" : "Te falta"}
              </span>
            </span>
            <span className="text-right text-xs text-muted">
              {KIND_LABELS[line.kind]}
              <span className="block text-sm font-black text-navy tabular-nums">
                ×{line.weight}
              </span>
            </span>
          </li>
        ))}

        {result.location && (
          <li className="flex items-center gap-3 rounded-2xl border border-dashed border-danger/40 px-4 py-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-danger-wash text-danger">
              <Icon name="mapPin" size={14} />
            </span>
            <span className="min-w-0 flex-1 text-sm text-ink">
              Fuera de tu ciudad ({result.location.city}) y no te reubicas
            </span>
            <span className="text-sm font-black text-danger tabular-nums">
              −{result.location.points}
            </span>
          </li>
        )}
      </ul>

      <div className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3 text-sm">
        <span className="text-muted">
          Peso ganado{" "}
          <strong className="text-ink tabular-nums">
            {earned} / {total}
          </strong>
        </span>
        <span className="text-lg font-black text-navy tabular-nums">{result.score}%</span>
      </div>

      <p className="text-sm text-pretty text-muted">
        Ganas {earned} del peso total de {total}: {earned} ÷ {total} ={" "}
        {scoreFromWeights(earned, total)}%.
        {result.location &&
          ` La vacante está en ${result.location.city} y no te reubicas, así que pierde ${result.location.points} puntos: ${result.score}%.`}{" "}
        Un obligatorio vale ×{WEIGHTS["must-have"]} y un deseable ×{WEIGHTS["nice-to-have"]}; si no
        te reubicas, una vacante no remota fuera de tu ciudad pierde {LOCATION_DEDUCTION} puntos.
        Los nombres de habilidades se comparan con flexibilidad: <code>Node.js</code> y{" "}
        <code>NodeJS</code> cuentan igual.
      </p>
    </Card>
  );
}
