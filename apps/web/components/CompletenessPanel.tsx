import type { CompletenessResult } from "@moonlight/types";
import { COMPLETENESS_FIELDS, completenessAt } from "@moonlight/core";

import { Icon } from "./Icon";
import { Chip, ProgressBar } from "./primitives";

const filledFields = (completeness: CompletenessResult): number =>
  COMPLETENESS_FIELDS.length - completeness.missing.length;

/** "7 de 9 campos", spelled the same way everywhere it is printed. */
export function filledFieldsLabel(completeness: CompletenessResult): string {
  return `${filledFields(completeness)} de ${COMPLETENESS_FIELDS.length} campos`;
}

/**
 * The bar and the fields still empty. Dashboard, profile and wizard share it.
 * The first empty field is set apart with the percentage it takes the profile
 * to, so the panel says what to do next and not only what is missing.
 * Where the percentage is already printed large above it, `figure={false}`
 * leaves it out here, so one view never shows the same number twice.
 */
export function CompletenessPanel({
  completeness,
  dark = false,
  figure = true,
}: {
  completeness: CompletenessResult;
  dark?: boolean;
  figure?: boolean;
}) {
  const reach = completenessAt(filledFields(completeness) + 1);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm">
        <span className={`font-bold ${dark ? "text-white" : "text-ink"}`}>
          {filledFieldsLabel(completeness)}
        </span>
        {figure && (
          <span className={`font-black tabular-nums ${dark ? "text-mint" : "text-brand"}`}>
            {completeness.percentage}%
          </span>
        )}
      </div>
      <ProgressBar percentage={completeness.percentage} label="Completitud del perfil" dark={dark} />
      <div className="flex flex-wrap items-center gap-2">
        {completeness.missing.length === 0 ? (
          <Chip tone="met">Todos los campos completos</Chip>
        ) : (
          completeness.missing.map((label, index) => {
            if (index === 0) {
              const next = (
                <>
                  <span className="sr-only">Siguiente: </span>
                  {label}
                  <Icon name="arrowRight" size={12} strokeWidth={2.6} />
                  <span className="sr-only">llegas a </span>
                  {reach}%
                </>
              );
              return dark ? (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1 text-[13px] font-bold text-mint-ink"
                >
                  {next}
                </span>
              ) : (
                <Chip key={label} tone="next">
                  {next}
                </Chip>
              );
            }
            return dark ? (
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
            );
          })
        )}
      </div>
    </div>
  );
}
