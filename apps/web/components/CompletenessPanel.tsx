import type { ReactNode } from "react";
import type { CompletenessResult } from "@moonlight/types";
import { COMPLETENESS_FIELDS } from "@moonlight/core";

import { Chip, ProgressBar } from "./primitives";

/** "7 of 9 fields", spelled the same way everywhere it is printed. */
export function filledFieldsLabel(completeness: CompletenessResult): string {
  const filled = COMPLETENESS_FIELDS.length - completeness.missing.length;
  return `${filled} of ${COMPLETENESS_FIELDS.length} fields`;
}

/**
 * The completeness readout: a heading row, the bar, and the fields still empty.
 * Dashboard and profile ask the same question in different words, so the two
 * halves of the heading row are props and nothing below them is.
 */
export function CompletenessPanel({
  completeness,
  heading,
  detail,
}: {
  completeness: CompletenessResult;
  heading: ReactNode;
  detail: string;
}) {
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="split">
        {heading}
        <span className="meta num" style={{ whiteSpace: "nowrap" }}>
          {detail}
        </span>
      </div>

      <ProgressBar percentage={completeness.percentage} label="Profile completeness" />

      <div className="chips">
        <span className="meta" style={{ color: "var(--muted)" }}>
          Missing:
        </span>
        {completeness.missing.length === 0 ? (
          <span className="meta" style={{ color: "var(--gold-text)" }}>
            nothing — every field is filled.
          </span>
        ) : (
          completeness.missing.map((label) => (
            <Chip key={label} tone="dashed">
              {label}
            </Chip>
          ))
        )}
      </div>
    </div>
  );
}
