import type { MarketGap, ScoreResult } from "@moonlight/types";
import { WEIGHTS, normalizeSkill, scoreFromWeights, topGaps } from "@moonlight/core";

import { Icon } from "../../../components/Icon";
import { Card, Chip, ProgressBar } from "../../../components/primitives";
import { KIND_LABELS } from "./ScoreBreakdown";

/** How many gaps get a before-and-after row of their own; the rest stay chips. */
const DETAILED = 3;

/** What the candidate is missing, and what closing each gap is worth. */
export function CloseTheGap({
  result,
  earned,
  total,
  gaps,
  vacancyCount,
}: {
  result: ScoreResult;
  earned: number;
  total: number;
  gaps: MarketGap[];
  vacancyCount: number;
}) {
  if (result.breakdown.length === 0) return null;

  // Every gap, in core's must-haves-first order; the first DETAILED get their own row.
  const missing = topGaps(result, result.missing.length);
  if (missing.length === 0) {
    return (
      <Card className="flex animate-rise flex-col gap-2 border-mint bg-mint-wash p-6 [animation-delay:220ms]">
        <span className="flex items-center gap-2 text-lg font-black text-mint-deep">
          <Icon name="sparkles" size={18} /> Match completo
        </span>
        <p className="text-sm text-pretty text-ink">
          Cumples los {result.breakdown.length} requisitos, incluidos los obligatorios. No te falta
          nada para esta: postúlate.
        </p>
      </Card>
    );
  }

  const gapBySkill = new Map(gaps.map((gap) => [normalizeSkill(gap.skill), gap]));
  const rest = missing.length - DETAILED;

  return (
    <Card className="flex animate-rise flex-col gap-5 p-6 [animation-delay:220ms]">
      <div>
        <h2 className="text-xl font-black text-slate">Cierra la brecha</h2>
        <p className="mt-1 text-sm text-pretty text-muted">
          {missing.some((r) => r.kind === "must-have")
            ? "Los obligatorios van primero: cada uno vale tres veces un deseable, así que mueven más tu puntaje."
            : "Solo te faltan deseables: ya tienes todos los obligatorios que pide esta vacante."}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {missing.map((requirement) => (
          <Chip key={requirement.skill} tone="missing">
            {requirement.skill}
          </Chip>
        ))}
      </div>

      {missing.slice(0, DETAILED).map((requirement) => {
        const weight = WEIGHTS[requirement.kind];
        const potential = scoreFromWeights(earned + weight, total, result.location);
        const gap = gapBySkill.get(normalizeSkill(requirement.skill));
        const others = gap ? gap.demandCount - 1 : 0;

        return (
          <div key={requirement.skill} className="flex flex-col gap-2 border-t border-line pt-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-bold text-ink">Si aprendes {requirement.skill}</span>
              <span className="text-xs text-muted">
                {KIND_LABELS[requirement.kind]} · ×{weight}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm font-black tabular-nums">
              <span className="text-muted">{result.score}%</span>
              <div className="flex-1">
                <ProgressBar
                  percentage={potential}
                  label={`Puntaje con ${requirement.skill}`}
                  thin
                />
              </div>
              <span className="text-brand">{potential}%</span>
            </div>
            <p className="text-xs text-pretty text-muted">
              {gap
                ? `La piden ${gap.demandCount} de las ${vacancyCount} vacantes abiertas` +
                  (others > 0
                    ? `, así que también sube tu puntaje en ${others} más.`
                    : ", y esta es la única.")
                : `Aprenderla lleva este match a ${potential}%.`}
            </p>
          </div>
        );
      })}

      {rest > 0 && (
        <span className="text-xs text-muted">
          {rest === 1
            ? "Otro requisito faltante está en la lista de arriba."
            : `Otros ${rest} requisitos faltantes están en la lista de arriba.`}
        </span>
      )}
    </Card>
  );
}
