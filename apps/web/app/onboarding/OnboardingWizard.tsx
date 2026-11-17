"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  Education,
  Expectations,
  Experience,
  Profile,
  Vacancy,
  WorkMode,
} from "@moonlight/types";
import { normalizeSkill, profileCompleteness } from "@moonlight/core";

import { Icon } from "../../components/Icon";
import { Card, Eyebrow, ProgressBar, buttonClass } from "../../components/primitives";
import { useSlidingPill } from "../../components/sliding-pill";
import { chooseProfile, saveProfile } from "../../lib/client";
import { BLANK_EDUCATION, BLANK_EXPERIENCE, EducationStep, ExperienceStep } from "./entry-steps";
import { CompletenessRail, LaptopPanel } from "./fields";
import { BasicsStep, ExpectationsStep, SkillsStep } from "./steps";
import { useTyping } from "./typing";

/**
 * Five steps over one draft profile. Only this component holds the draft; the
 * step bodies below are given the slice they edit and a way to change it. That
 * is what lets the completeness bar be recomputed on every keystroke, from the
 * same function the dashboard reads.
 */

const STEPS = [
  {
    label: "Datos básicos",
    title: "Quién eres",
    blurb:
      "Nombre y ciudad cuentan para la completitud. Tu ciudad decide qué vacantes presenciales e híbridas te llegan.",
  },
  {
    label: "Habilidades",
    title: "Qué sabes hacer",
    blurb:
      "El puntaje se construye con tus habilidades. Un requisito obligatorio que cumples vale tres veces uno deseable.",
  },
  {
    label: "Experiencia",
    title: "Dónde has trabajado",
    blurb:
      "Los cargos aún no cambian el puntaje, pero los reclutadores los leen. Deja el más reciente primero.",
  },
  {
    label: "Educación",
    title: "Qué estudiaste",
    blurb: "Con uno basta. Agrega el título que estás terminando aunque aún no lo tengas.",
  },
  {
    label: "Expectativas",
    title: "Qué estás buscando",
    blurb:
      "Los últimos campos. No filtramos nada, pero si no te reubicas, las vacantes fuera de tu ciudad puntúan menos.",
  },
] as const;

const LAST_STEP = STEPS.length - 1;

export function OnboardingWizard({
  initial,
  vacancies,
  fresh = false,
}: {
  initial: Profile;
  vacancies: Vacancy[];
  /** A new profile: saving creates it and makes it the one the app acts as. */
  fresh?: boolean | undefined;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(initial);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const current = STEPS[step] ?? STEPS[0];
  const completeness = profileCompleteness(profile);
  const { typing, area, fieldEvents, focusFirstField } = useTyping();

  function patch(changes: Partial<Profile>): void {
    setProfile((p) => ({ ...p, ...changes }));
  }

  function patchExpectations(changes: Partial<Expectations>): void {
    setProfile((p) => ({ ...p, expectations: { ...p.expectations, ...changes } }));
  }

  function updateExperience(index: number, changes: Partial<Experience>): void {
    setProfile((p) => ({
      ...p,
      experience: p.experience.map((item, i) => (i === index ? { ...item, ...changes } : item)),
    }));
  }

  function updateEducation(index: number, changes: Partial<Education>): void {
    setProfile((p) => ({
      ...p,
      education: p.education.map((item, i) => (i === index ? { ...item, ...changes } : item)),
    }));
  }

  function addSkill(name: string): void {
    setProfile((p) =>
      p.skills.some((s) => normalizeSkill(s.name) === normalizeSkill(name))
        ? p
        : { ...p, skills: [...p.skills, { name }] },
    );
  }

  function toggleWorkMode(mode: WorkMode): void {
    setProfile((p) => {
      const { workModes } = p.expectations;
      return {
        ...p,
        expectations: {
          ...p.expectations,
          workModes: workModes.includes(mode)
            ? workModes.filter((m) => m !== mode)
            : [...workModes, mode],
        },
      };
    });
  }

  async function finish(): Promise<void> {
    const fullName = profile.fullName.trim();
    const email = profile.email.trim();
    if (fullName.length === 0 || email.length === 0) {
      setError("Sin tu nombre y tu correo no podemos guardar el perfil.");
      setStep(0);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await saveProfile({ ...profile, fullName, email });
      if (fresh) {
        // On a fresh page, so the header, Luna and every screen act as the new person.
        await chooseProfile(profile.id);
        window.location.assign("/dashboard");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar tu perfil.");
      setSaving(false);
    }
  }

  function goNext(): void {
    if (step === LAST_STEP) {
      void finish();
      return;
    }
    setError(null);
    setStep(step + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex animate-rise flex-col gap-4">
        <Stepper step={step} onGo={setStep} />
        <ProgressBar
          percentage={((step + 1) / STEPS.length) * 100}
          label={`Paso ${step + 1} de ${STEPS.length}`}
          thin
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="flex animate-rise flex-col gap-6 p-6 [animation-delay:80ms] max-lg:order-2 sm:p-8">
          <div>
            <Eyebrow>
              Paso {step + 1} de {STEPS.length}
            </Eyebrow>
            <h2 className="mt-1 text-2xl font-black text-slate">{current.title}</h2>
            <p className="mt-2 max-w-[52ch] text-sm text-pretty text-muted">{current.blurb}</p>
          </div>

          <div key={step} ref={area} className="flex animate-rise flex-col gap-5" {...fieldEvents}>
            {/* An import fills the profile the app acts as, which a new one is not until it is saved. */}
            {step === 0 && !fresh && <ImportPrompt />}
            {step === 0 && <BasicsStep profile={profile} onPatch={patch} />}

            {step === 1 && (
              <SkillsStep
                profile={profile}
                vacancies={vacancies}
                onSetSkills={(names) => patch({ skills: names.map((name) => ({ name })) })}
                onAddSkill={addSkill}
              />
            )}

            {step === 2 && (
              <ExperienceStep
                items={profile.experience}
                onUpdate={updateExperience}
                onAdd={() => patch({ experience: [...profile.experience, BLANK_EXPERIENCE] })}
                onRemove={(index) =>
                  patch({ experience: profile.experience.filter((_, i) => i !== index) })
                }
              />
            )}

            {step === 3 && (
              <EducationStep
                items={profile.education}
                onUpdate={updateEducation}
                onAdd={() =>
                  patch({
                    education: [
                      ...profile.education,
                      { ...BLANK_EDUCATION, startYear: new Date().getUTCFullYear() },
                    ],
                  })
                }
                onRemove={(index) =>
                  patch({ education: profile.education.filter((_, i) => i !== index) })
                }
              />
            )}

            {step === 4 && (
              <ExpectationsStep
                expectations={profile.expectations}
                onPatch={patchExpectations}
                onToggleWorkMode={toggleWorkMode}
              />
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-2xl bg-danger-wash px-4 py-3 text-sm font-bold text-danger"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
            <button
              type="button"
              className={buttonClass("quiet")}
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0 || saving}
            >
              <Icon name="arrowLeft" size={16} strokeWidth={2.4} />
              Anterior
            </button>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <span className="text-xs text-muted">
                {step === LAST_STEP
                  ? "Esto es lo que guardamos."
                  : "Nada se guarda hasta el último paso."}
              </span>
              <button
                type="button"
                className={buttonClass("primary")}
                onClick={goNext}
                disabled={saving}
                aria-busy={saving}
              >
                {saving ? "Guardando…" : step === LAST_STEP ? "Guardar perfil" : "Siguiente"}
                {!saving && <Icon name="arrowRight" size={16} strokeWidth={2.4} />}
              </button>
            </div>
          </div>
        </Card>

        {/* On phones the laptop goes above the form, so it is in sight while typing. */}
        <div className="flex flex-col gap-6 max-lg:contents lg:sticky lg:top-24">
          <div className="max-lg:order-1">
            <LaptopPanel
              typing={typing}
              profile={profile}
              completeness={completeness.percentage}
              onActivate={focusFirstField}
            />
          </div>
          <div className="max-lg:order-3">
            <CompletenessRail completeness={completeness} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stepper({ step, onGo }: { step: number; onGo: (index: number) => void }) {
  // Steps are drawn from where the pill is, so they change colour as it moves on.
  const { pill, at, lit } = useSlidingPill(step);
  return (
    <div className="relative">
      {pill}
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => {
          const tone = lit(i);
          return (
            <li key={s.label}>
              <button
                type="button"
                onClick={() => onGo(i)}
                aria-current={i === step ? "step" : undefined}
                className={`inline-flex h-10 items-center gap-2 rounded-full pr-4 pl-1.5 text-sm font-bold transition ${
                  tone ??
                  (i < at
                    ? "bg-mint-wash text-mint-deep hover:bg-mint"
                    : "bg-surface text-muted hover:bg-surface-strong")
                }`}
              >
                {/* Only the content is relative: the pill passes over the other chips' fill, under their text. */}
                <span
                  className={`relative flex size-7 items-center justify-center rounded-full text-xs tabular-nums transition ${
                    tone ? "bg-white/15" : "bg-canvas"
                  }`}
                >
                  {i < at ? <Icon name="check" size={13} strokeWidth={3} /> : i + 1}
                </span>
                <span className="relative">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** The shortcut past typing it all: bring the entries from LinkedIn or a résumé. */
function ImportPrompt() {
  return (
    <Link
      href="/import"
      className="group flex items-center gap-3 rounded-3xl border border-brand/30 bg-brand-wash p-4 transition hover:border-brand"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-canvas text-brand">
        <Icon name="upload" size={18} />
      </span>
      <span className="flex-1 text-sm text-ink">
        <span className="font-bold text-slate">¿Tienes LinkedIn o una hoja de vida en PDF?</span>{" "}
        Impórtala y revisa lo que encontremos.
      </span>
      <span className="flex items-center gap-1 text-sm font-bold text-brand">
        Importar
        <span className="transition group-hover:translate-x-0.5">
          <Icon name="arrowRight" size={16} />
        </span>
      </span>
    </Link>
  );
}
