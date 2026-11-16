"use client";

import { useEffect, useState } from "react";
import { diffCv, toHarvardCv } from "@moonlight/core";
import type { CvDiff, CvDocument, CvEntry, Profile } from "@moonlight/types";

import { HarvardCv } from "../../../components/cv/HarvardCv";
import { Icon } from "../../../components/Icon";
import { Card, Chip, Eyebrow, TogglePill, buttonClass } from "../../../components/primitives";
import { tailorProfile } from "../../../lib/client";
import { CvChanges, DiffLegend } from "./CvChanges";

type Result = {
  check: { ok: boolean; problems: string[] };
  /** The tailored CV, and how it differs from the plain one. */
  after: CvDocument;
  diff: CvDiff;
};

type View = "split" | "changes";

const VIEWS: ReadonlyArray<{ id: View; label: string }> = [
  { id: "split", label: "Lado a lado" },
  { id: "changes", label: "Solo cambios" },
];

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
  const [view, setView] = useState<View>("split");

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

  // Once there is a tailored CV, paper gets only its sheet, from this button or Ctrl+P alike;
  // "Guardar como PDF" names the file after the page title, so it names the candidate meanwhile.
  useEffect(() => {
    if (!result) return;
    const title = document.title;
    const rename = (): void => {
      document.title = `${profile.fullName} · Hoja de vida · ${vacancyTitle}`;
    };
    const restore = (): void => {
      document.title = title;
    };
    window.addEventListener("beforeprint", rename);
    window.addEventListener("afterprint", restore);
    return () => {
      window.removeEventListener("beforeprint", rename);
      window.removeEventListener("afterprint", restore);
    };
  }, [result, profile.fullName, vacancyTitle]);

  const sides = [
    { side: "before", label: "Versión original" },
    { side: "after", label: `Adaptada para ${vacancyTitle}` },
  ] as const;

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
          <div className="flex animate-pop flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {result.check.ok && (
                  <Chip tone="met">
                    Verificado: no agrega empresas, cargos, fechas ni habilidades nuevas
                  </Chip>
                )}
                <Chip tone="brand">
                  {result.diff.changes === 0
                    ? "Sin cambios"
                    : `${result.diff.changes} ${result.diff.changes === 1 ? "cambio" : "cambios"}`}
                </Chip>
              </div>
              <div className="flex flex-wrap gap-2">
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
              </div>
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
                    <HarvardCv diff={result.diff} side={side} compact />
                  </section>
                ))}
              </div>
            ) : (
              <CvChanges diff={result.diff} />
            )}
          </div>
        )}
      </Card>

      {result && (
        // The vacancy page hides itself in print while this sheet exists.
        <div data-print-sheet className="hidden print:block">
          <HarvardCv doc={result.after} standalone />
        </div>
      )}
    </>
  );
}
