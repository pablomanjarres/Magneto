import type { CompletenessResult } from "@moonlight/types";
import { COMPLETENESS_FIELDS } from "@moonlight/core";

import { Chip, ProgressBar } from "./primitives";

/** "7 de 9 campos", spelled the same way everywhere it is printed. */
export function filledFieldsLabel(completeness: CompletenessResult): string {
  const filled = COMPLETENESS_FIELDS.length - completeness.missing.length;
  return `${filled} de ${COMPLETENESS_FIELDS.length} campos`;
}

/** The bar and the fields still empty. Dashboard, profile and wizard share it. */
export function CompletenessPanel({
  completeness,
  dark = false,
}: {
  completeness: CompletenessResult;
  dark?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm">
        <span className={`font-bold ${dark ? "text-white" : "text-ink"}`}>
          {filledFieldsLabel(completeness)}
        </span>
        <span className={`font-black tabular-nums ${dark ? "text-mint" : "text-brand"}`}>
          {completeness.percentage}%
        </span>
      </div>
      <ProgressBar percentage={completeness.percentage} label="Completitud del perfil" />
      <div className="flex flex-wrap items-center gap-2">
        {completeness.missing.length === 0 ? (
          <Chip tone="met">Todos los campos completos</Chip>
        ) : (
          completeness.missing.map((label) =>
            dark ? (
              <span
                key={label}
                className="rounded-full border border-dashed border-white/40 px-3 py-1 text-[13px] font-bold text-white/85"
              >
                {label}
              </span>
            ) : (
              <Chip key={label} tone="dashed">
                {label}
              </Chip>
            ),
          )
        )}
      </div>
    </div>
  );
}
