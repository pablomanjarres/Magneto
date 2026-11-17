"use client";

import { useState } from "react";
import { diffCv, toHarvardCv } from "@moonlight/core";
import type { CvDiff, CvDocument, CvEntry, Profile } from "@moonlight/types";

import { CvComparison } from "../../../components/cv/CvComparison";
import { PrintSheet } from "../../../components/cv/PrintSheet";
import { Icon } from "../../../components/Icon";
import { Card, buttonClass } from "../../../components/primitives";
import { tailorProfile } from "../../../lib/client";
import { cvTitle } from "../../../lib/format";

type Result = {
  check: { ok: boolean; problems: string[] };
  /** The tailored CV, and how it differs from the plain one. */
  after: CvDocument;
  diff: CvDiff;
};

/** The tailored CV as plain text, the same one the download prints, ready to paste. */
function asText(cv: CvDocument): string {
  const entry = (e: CvEntry): string =>
    [
      [e.title, e.place].filter(Boolean).join(", "),
      [e.subtitle, e.dates].filter(Boolean).join(", "),
      ...e.bullets.map((bullet) => `• ${bullet}`),
    ].join("\n");
  return [
    `${cv.name}\n${cv.contact.join(" • ")}`,
    ...cv.sections.map((s) =>
      [s.title.toUpperCase(), ...s.lines, ...s.entries.map(entry)].join("\n"),
    ),
  ].join("\n\n");
}

/**
 * The CV rewritten for this vacancy, next to the original with every change
 * marked. The result is shown only once the API answers and its check confirms
 * nothing was invented.
 */
export function TailorPanel({
  profile,
  vacancyId,
  vacancyTitle,
}: {
  profile: Profile;
  vacancyId: string;
  vacancyTitle: string;
}) {
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function tailor(): Promise<void> {
    setPending(true);
    setError(null);
    try {
      const { tailored, check } = await tailorProfile(profile.id, vacancyId);
      // Core is isomorphic, so both CVs and their diff are built here, once.
      const after = toHarvardCv(profile, tailored);
      setResult({ check, after, diff: diffCv(toHarvardCv(profile), after) });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos adaptar tu perfil.");
    } finally {
      setPending(false);
    }
  }

  async function copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("No pudimos copiar el texto. Selecciónalo y cópialo a mano.");
    }
  }

  return (
    <>
      <Card className="flex animate-rise flex-col gap-5 p-6 [animation-delay:300ms] print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-xl font-black text-slate">Tu perfil adaptado a esta vacante</h2>
            <p className="mt-1 text-sm text-pretty text-muted">
              Reordenamos y reescribimos tu perfil para destacar lo que pide esta vacante, sin
              agregar nada que no hayas confirmado.
            </p>
          </div>
          {!result && (
            <button
              type="button"
              className={buttonClass("primary")}
              onClick={() => void tailor()}
              disabled={pending}
              aria-busy={pending}
            >
              <Icon name="sparkles" size={16} />
              {error ? "Intentar de nuevo" : "Adaptar mi perfil"}
            </button>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm font-bold text-danger">
            {error}
          </p>
        )}

        {pending && (
          <div className="flex flex-col gap-3" aria-live="polite">
            <span className="text-sm font-bold text-brand">Adaptando tu perfil…</span>
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1].map((column) => (
                <div
                  key={column}
                  className="h-56 rounded-3xl bg-[linear-gradient(90deg,var(--color-surface),var(--color-surface-strong),var(--color-surface))] bg-[length:200%_100%] motion-safe:animate-shimmer"
                />
              ))}
            </div>
          </div>
        )}

        {result && (
          <CvComparison
            diff={result.diff}
            verified={result.check.ok}
            afterLabel={`Adaptada para ${vacancyTitle}`}
            actions={
              <>
                <button
                  type="button"
                  className={buttonClass("quiet", "sm")}
                  onClick={() => void copy(asText(result.after))}
                >
                  <Icon name={copied ? "check" : "copy"} size={14} strokeWidth={2.4} />
                  {copied ? "Copiado" : "Copiar"}
                </button>
                <button
                  type="button"
                  className={buttonClass("primary", "sm")}
                  onClick={() => window.print()}
                >
                  <Icon name="download" size={14} strokeWidth={2.4} />
                  Descargar CV adaptado
                </button>
              </>
            }
          />
        )}
      </Card>

      {result && (
        // The vacancy page hides itself in print while this sheet exists.
        <PrintSheet
          doc={result.after}
          title={cvTitle(profile.fullName, vacancyTitle)}
        />
      )}
    </>
  );
}
