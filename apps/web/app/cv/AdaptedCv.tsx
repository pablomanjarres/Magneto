"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { acceptTailored, checkTailored, diffCv, toHarvardCv } from "@moonlight/core";
import type { Profile } from "@moonlight/types";

import { CvComparison } from "../../components/cv/CvComparison";
import { Icon } from "../../components/Icon";
import { buttonClass } from "../../components/primitives";
import { useAssistant } from "../../components/luna/Assistant";
import { saveProfile } from "../../lib/client";

/**
 * Luna's proposal against the résumé as it is. Accepting saves it into the
 * profile, so the résumé above becomes this version; discarding drops it.
 * `children` (the résumé itself) shows while there is no proposal.
 */
export function AdaptedCv({ profile, children }: { profile: Profile; children: ReactNode }) {
  const router = useRouter();
  const { tailored, clearTailored } = useAssistant();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!tailored) return children;

  async function accept(): Promise<void> {
    if (!tailored) return;
    setSaving(true);
    setError(null);
    try {
      await saveProfile(acceptTailored(profile, tailored));
      clearTailored();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <CvComparison
        diff={diffCv(toHarvardCv(profile), toHarvardCv(profile, tailored))}
        verified={checkTailored(profile, tailored).ok}
        afterLabel="Con los cambios"
        actions={
          <>
            <button
              type="button"
              className={buttonClass("quiet", "sm")}
              onClick={() => {
                setError(null);
                clearTailored();
              }}
              disabled={saving}
            >
              <Icon name="close" size={14} strokeWidth={2.4} />
              Descartar
            </button>
            <button
              type="button"
              className={buttonClass("primary", "sm")}
              onClick={accept}
              disabled={saving}
              aria-busy={saving}
            >
              <Icon name="check" size={14} strokeWidth={2.6} />
              {saving ? "Guardando…" : "Aceptar cambios"}
            </button>
          </>
        }
      />
      {error && (
        <p
          role="alert"
          className="rounded-2xl bg-danger-wash px-4 py-3 text-sm font-bold text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}
