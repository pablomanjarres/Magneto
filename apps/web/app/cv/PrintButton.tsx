"use client";

import { Icon } from "../../components/Icon";
import { buttonClass } from "../../components/primitives";

/** The print dialog's "Guardar como PDF" does the download; the print styles leave only the sheet. */
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClass("primary")}>
      <Icon name="download" size={16} />
      Descargar PDF
    </button>
  );
}
