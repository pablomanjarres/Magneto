import type { CompletenessResult } from "@moonlight/types";
import { COMPLETENESS_FIELDS, completenessAt } from "@moonlight/core";

import { Icon } from "./Icon";
import { Chip, ProgressBar } from "./primitives";

const filledFields = (completeness: CompletenessResult): number =>
  COMPLETENESS_FIELDS.length - completeness.missing.length;

/** The wizard step that fills a completeness field, by the field's label. */
function stepHref(label: string): string | undefined {
  const field = COMPLETENESS_FIELDS.find((f) => f.label === label);
  return field && `/onboarding?step=${field.section}`;
}

/** "7 de 9 campos", spelled the same way everywhere it is printed. */
export function filledFieldsLabel(completeness: CompletenessResult): string {
  return `${filledFields(completeness)} de ${COMPLETENESS_FIELDS.length} campos`;
}

/**
 * The bar and the fields still empty. Dashboard, profile, wizard and the
 * import's last screen share it.
 * The first empty field is set apart with the percentage it takes the profile
 * to, so the panel says what to do next and not only what is missing.
 * Where the percentage is already printed large above it, `figure={false}`
 * leaves it out here, so one view never shows the same number twice.
 * `linked` makes each empty field a link to the wizard step that fills it;
 * the wizard itself leaves it off: it already shows the steps and moves between them in place.
 */
export function CompletenessPanel({
  completeness,
  dark = false,
  figure = true,
  linked = false,
}: {
  completeness: CompletenessResult;
  dark?: boolean;
  figure?: boolean;
  linked?: boolean;
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
      <ProgressBar
        percentage={completeness.percentage}
        label="Completitud del perfil"
        dark={dark}
      />
      <div className="flex flex-wrap items-center gap-2">
        {completeness.missing.length === 0 ? (
          <Chip tone="met">Todos los campos completos</Chip>
        ) : (
          completeness.missing.map((label, index) => {
            const href = linked ? stepHref(label) : undefined;
            if (index === 0) {
              return (
                <Chip key={label} tone={dark ? "nextDark" : "next"} href={href}>
                  <span className="sr-only">Siguiente: </span>
                  {label}
                  <Icon name="arrowRight" size={12} strokeWidth={2.6} />
                  <span className="sr-only">llegas a </span>
                  {reach}%
                </Chip>
              );
            }
            return (
              <Chip key={label} tone={dark ? "dashedDark" : "dashed"} href={href}>
                {href !== undefined && <span className="sr-only">Completar </span>}
                {label}
              </Chip>
            );
          })
        )}
      </div>
    </div>
  );
}
