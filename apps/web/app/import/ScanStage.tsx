import type { ProfileSource } from "@moonlight/types";

import { Icon } from "../../components/Icon";
import { Card, Eyebrow } from "../../components/primitives";

const STEPS: Record<ProfileSource, readonly string[]> = {
  linkedin: [
    "Conectando con LinkedIn",
    "Extrayendo experiencia, educación y habilidades",
    "Organizando tu perfil",
  ],
  resume: [
    "Leyendo tu hoja de vida",
    "Extrayendo experiencia, educación y habilidades",
    "Organizando tu perfil",
  ],
};

/** Skeleton rows of the document being read: a name, two positions, studies and skills. */
const ROWS = ["w-2/5 h-5", "w-3/5", "w-4/5", "w-1/2", "w-3/4", "w-2/3", "w-1/3", "w-3/5"];

/**
 * The scan while an import runs. The steps follow the real events from the
 * server: `done` counts the steps already finished, so nothing is ticked before
 * it happened.
 */
export function ScanStage({ source, done }: { source: ProfileSource; done: number }) {
  const steps = STEPS[source];

  return (
    <Card className="grid animate-pop gap-8 p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-center">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6">
        <div className="mb-5 flex items-center gap-3">
          <span
            className={`flex size-11 items-center justify-center rounded-2xl text-lg font-black ${
              source === "linkedin" ? "bg-brand text-white" : "bg-mint text-mint-ink"
            }`}
          >
            {source === "linkedin" ? "in" : "PDF"}
          </span>
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-3 w-1/2 rounded-full bg-surface-strong" />
            <div className="h-2.5 w-1/3 rounded-full bg-surface-strong" />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {ROWS.map((row, i) => (
            <div
              key={i}
              className={`rounded-full bg-surface-strong ${row.includes("h-") ? row : `${row} h-2.5`}`}
            />
          ))}
        </div>

        {/* The beam sits on the bottom edge of a half-height layer, so sliding the
            layer from -100% to 100% of its own height sweeps it over the whole card. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex h-1/2 flex-col justify-end motion-safe:animate-scan">
          <div className="h-24 bg-gradient-to-b from-transparent via-brand/15 to-brand/35" />
          <div className="h-0.5 bg-brand shadow-[0_0_24px_6px_rgba(124,0,255,0.45)]" />
        </div>
      </div>

      <div className="flex flex-col gap-5" aria-live="polite">
        <div>
          <Eyebrow>
            {source === "linkedin" ? "Importando desde LinkedIn" : "Leyendo tu PDF"}
          </Eyebrow>
          <h2 className="mt-1 text-2xl font-black text-slate">Estamos armando tu perfil</h2>
          <p className="mt-1 text-sm text-muted">
            {source === "linkedin"
              ? "LinkedIn puede tardar hasta medio minuto en responder."
              : "Toma unos segundos. No guardamos nada hasta que lo confirmes."}
          </p>
        </div>

        <ol className="flex flex-col gap-3">
          {steps.map((label, i) => {
            const finished = i < done;
            const current = i === done;
            return (
              <li
                key={label}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors duration-300 ${
                  current ? "bg-brand-wash" : finished ? "bg-mint-wash" : "bg-surface"
                }`}
              >
                {finished ? (
                  <span className="flex size-7 animate-pop items-center justify-center rounded-full bg-mint text-mint-ink">
                    <Icon name="check" size={15} strokeWidth={3} />
                  </span>
                ) : current ? (
                  <span
                    className="size-7 rounded-full border-[3px] border-brand/25 border-t-brand motion-safe:animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <span className="size-7 rounded-full border-2 border-dashed border-control" />
                )}
                <span
                  className={`text-sm font-bold ${
                    current ? "text-brand" : finished ? "text-mint-deep" : "text-muted"
                  }`}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </Card>
  );
}
