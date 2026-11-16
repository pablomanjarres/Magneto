"use client";

import { useState, type ReactNode } from "react";
import type { CvDiff } from "@moonlight/types";

import { CvChanges, DiffLegend } from "./CvChanges";
import { HarvardCv } from "./HarvardCv";
import { Chip, Eyebrow, TogglePill } from "../primitives";

type View = "split" | "changes";

const VIEWS: ReadonlyArray<{ id: View; label: string }> = [
  { id: "split", label: "Lado a lado" },
  { id: "changes", label: "Solo cambios" },
];

/**
 * An adapted hoja de vida against the original: what was checked and how much
 * changed, the caller's actions, then both sheets side by side or only the changes.
 */
export function CvComparison({
  diff,
  verified,
  afterLabel,
  actions,
}: {
  diff: CvDiff;
  verified: boolean;
  afterLabel: string;
  actions: ReactNode;
}) {
  const [view, setView] = useState<View>("split");
  const sides = [
    { side: "before", label: "Versión original" },
    { side: "after", label: afterLabel },
  ] as const;

  return (
    <div className="flex animate-pop flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {verified && (
            <Chip tone="met">
              Verificado: no agrega empresas, cargos, fechas ni habilidades nuevas
            </Chip>
          )}
          <Chip tone="brand">
            {diff.changes === 0
              ? "Sin cambios"
              : `${diff.changes} ${diff.changes === 1 ? "cambio" : "cambios"}`}
          </Chip>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Vista" className="flex flex-wrap gap-2">
          {VIEWS.map(({ id, label }) => (
            <TogglePill key={id} on={view === id} onClick={() => setView(id)}>
              {label}
            </TogglePill>
          ))}
        </div>
        <DiffLegend />
      </div>

      {view === "split" ? (
        <div className="grid gap-6 md:grid-cols-2">
          {sides.map(({ side, label }) => (
            // Named, so both sheets' identical section headings can be told apart.
            <section key={side} aria-label={label} className="flex min-w-0 flex-col gap-3">
              <Eyebrow>{label}</Eyebrow>
              <HarvardCv diff={diff} side={side} compact />
            </section>
          ))}
        </div>
      ) : (
        <CvChanges diff={diff} />
      )}
    </div>
  );
}
