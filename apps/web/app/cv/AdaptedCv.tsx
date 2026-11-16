"use client";

import type { ReactNode } from "react";
import { checkTailored, diffCv, toHarvardCv } from "@moonlight/core";
import type { Profile } from "@moonlight/types";

import { CvComparison } from "../../components/cv/CvComparison";
import { PrintSheet } from "../../components/cv/PrintSheet";
import { Icon } from "../../components/Icon";
import { buttonClass } from "../../components/primitives";
import { useAssistant } from "../../components/luna/Assistant";

/**
 * The version Luna adapted last, against the original, with its own download;
 * `children` (the original sheet) shows while there is none.
 */
export function AdaptedCv({ profile, children }: { profile: Profile; children: ReactNode }) {
  const { tailored, clearTailored } = useAssistant();
  if (!tailored) return children;

  const after = toHarvardCv(profile, tailored);
  return (
    <>
      <div className="print:hidden">
        <CvComparison
          diff={diffCv(toHarvardCv(profile), after)}
          verified={checkTailored(profile, tailored).ok}
          afterLabel="Versión adaptada"
          actions={
            <>
              <button type="button" className={buttonClass("quiet", "sm")} onClick={clearTailored}>
                <Icon name="arrowLeft" size={14} strokeWidth={2.4} />
                Volver a la original
              </button>
              <button
                type="button"
                className={buttonClass("primary", "sm")}
                onClick={() => window.print()}
              >
                <Icon name="download" size={14} strokeWidth={2.4} />
                Descargar esta versión
              </button>
            </>
          }
        />
      </div>
      <PrintSheet doc={after} title={`${profile.fullName} · Hoja de vida`} />
    </>
  );
}
