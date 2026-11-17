"use client";

import { useState, type ReactNode } from "react";
import type { ImportedProfile, Profile } from "@moonlight/types";
import {
  type ImportCounts,
  type ImportMode,
  applyImport,
  importMode,
  isEmail,
  profileCompleteness,
  sameJob,
  sameSkill,
  sameStudy,
} from "@moonlight/core";

import { CountUp } from "../../components/CountUp";
import { Icon, type IconName } from "../../components/Icon";
import {
  Card,
  Eyebrow,
  Field,
  TogglePill,
  buttonClass,
  inputClass,
} from "../../components/primitives";
import { saveProfile } from "../../lib/client";
import { EducationFields, ExperienceFields } from "../onboarding/entry-steps";
import { ReviewCard } from "./ReviewCard";
import {
  type ReviewState,
  initialReview,
  isBlocked,
  missingEducation,
  missingExperience,
  plural,
  selection,
} from "./review-model";

/** What an import saved, for the screen after it. */
export interface Saved {
  mode: ImportMode;
  added: ImportCounts;
  joined: ImportCounts;
}

interface Identity {
  fullName: string;
  email: string;
  city: string;
}

/** Name, e-mail and city the way the chosen mode leaves them, before any edit. */
function identityFor(profile: Profile, imported: ImportedProfile, mode: ImportMode): Identity {
  const empty = { ...imported, experience: [], education: [], skills: [] };
  const { fullName, email, city } = applyImport(profile, empty, mode).profile;
  return { fullName, email, city: city ?? "" };
}

const total = (c: ImportCounts): number => c.experience + c.education + c.skills;

/** Each card pops in a beat after the one before it. */
const STAGGER_MS = 70;

export function ReviewStep({
  profile,
  imported,
  onSaved,
}: {
  profile: Profile;
  imported: ImportedProfile;
  onSaved: (saved: Saved) => void;
}) {
  const [review, setReview] = useState<ReviewState>(() => initialReview(imported));
  const [mode, setMode] = useState<ImportMode>(() => importMode(profile, imported));
  const [identity, setIdentity] = useState<Identity>(() =>
    identityFor(profile, imported, importMode(profile, imported)),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const result = applyImport(profile, selection(imported, review), mode);
  const next: Profile = {
    ...result.profile,
    fullName: identity.fullName.trim(),
    email: identity.email.trim(),
    city: identity.city.trim() || undefined,
  };
  const was = profileCompleteness(profile);
  const will = profileCompleteness(next);
  const before = was.percentage;
  const after = will.percentage;
  // An address the profile would refuse is caught here, in Spanish, not by the server.
  const noIdentity = !next.fullName || !isEmail(next.email);
  const blocked = isBlocked(review) || noIdentity;
  const nothing = total(result.added) + total(result.joined) === 0;
  const completing = mode === "complement";
  const someoneElse = importMode(profile, imported) === "replace";

  function choose(m: ImportMode): void {
    setMode(m);
    setIdentity(identityFor(profile, imported, m));
    setError(null);
  }

  function edit(changes: Partial<Identity>): void {
    setIdentity((i) => ({ ...i, ...changes }));
    setError(null);
  }

  function update<K extends keyof ReviewState>(
    key: K,
    index: number,
    changes: Partial<ReviewState[K][number]>,
  ): void {
    setReview((r) => ({
      ...r,
      [key]: r[key].map((item, i) => (i === index ? { ...item, ...changes } : item)),
    }));
    setError(null);
  }

  async function confirm(): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      await saveProfile(next);
      onSaved({ mode, added: result.added, joined: result.joined });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar tu perfil.");
      setSaving(false);
    }
  }

  const counts = [
    {
      value: imported.experience.length,
      label: plural(imported.experience.length, "cargo", "cargos"),
    },
    {
      value: imported.education.length,
      label: plural(imported.education.length, "estudio", "estudios"),
    },
    {
      value: review.skills.length,
      label: plural(review.skills.length, "habilidad", "habilidades"),
    },
  ];
  // Skills already in the profile are joined, so only the new ones are worth a toggle.
  const isKnown = (name: string): boolean =>
    completing && profile.skills.some((held) => sameSkill(held.name, name));
  const fresh = review.skills.filter((s) => !isKnown(s.value));
  const known = review.skills.filter((s) => isKnown(s.value));
  const allFresh = fresh.every((s) => s.selected);

  // LinkedIn lists can run to dozens of skills: one click clears them to pick a few.
  function markFresh(selected: boolean): void {
    setReview((r) => ({
      ...r,
      skills: r.skills.map((item) => (isKnown(item.value) ? item : { ...item, selected })),
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="grid animate-pop gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <Eyebrow>Esto encontramos</Eyebrow>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-2xl font-black text-slate">
            {counts.map((c, i) => (
              <span
                key={c.label}
                className="animate-pop"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <span className="text-brand">
                  <CountUp value={c.value} duration={900} />
                </span>{" "}
                {c.label}
                {i < counts.length - 1 && <span className="ml-3 text-faint">·</span>}
              </span>
            ))}
          </p>
          <p className="mt-2 text-sm text-pretty text-muted">
            Revisa cada entrada. Solo se guarda lo que dejes marcado.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:border-l lg:border-line lg:pl-8">
          <Eyebrow>Completitud del perfil</Eyebrow>
          <CompletenessDelta
            before={before}
            after={after}
            gained={was.missing.filter((label) => !will.missing.includes(label))}
            lost={will.missing.filter((label) => !was.missing.includes(label))}
          />
        </div>
      </Card>

      <Card className="flex animate-rise flex-col gap-5 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <TogglePill on={!completing} onClick={() => choose("replace")}>
            Reemplazar mi perfil
          </TogglePill>
          <TogglePill on={completing} onClick={() => choose("complement")}>
            Completar mi perfil
          </TogglePill>
        </div>
        <p className="text-sm text-pretty text-muted">
          {completing
            ? "Lo nuevo se agrega y lo que ya tienes se completa, sin repetir nada."
            : "Tu perfil actual se borra y queda solo lo importado: datos, experiencia, educación y habilidades."}
          {someoneElse && imported.fullName && (
            <>
              {" "}
              Lo importado es de <strong className="text-ink">{imported.fullName}</strong>, no de{" "}
              <strong className="text-ink">{profile.fullName}</strong>.
            </>
          )}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Nombre completo">
              <input
                className={inputClass}
                value={identity.fullName}
                onChange={(e) => edit({ fullName: e.target.value })}
                autoComplete="name"
              />
            </Field>
          </div>
          <Field
            label="Correo"
            {...(identity.email ? {} : { hint: "La importación no lo trae: escríbelo." })}
          >
            <input
              className={inputClass}
              type="email"
              value={identity.email}
              onChange={(e) => edit({ email: e.target.value })}
              autoComplete="email"
            />
          </Field>
          <Field label="Ciudad">
            <input
              className={inputClass}
              value={identity.city}
              onChange={(e) => edit({ city: e.target.value })}
              autoComplete="address-level2"
            />
          </Field>
        </div>
      </Card>

      <ReviewSection title="Experiencia" icon="briefcase" count={review.experience.length}>
        {review.experience.map((item, i) => (
          <ReviewCard
            key={i}
            title={item.value.title}
            subtitle={item.value.company}
            period={`${item.value.startDate || "Sin fecha"} – ${item.value.endDate ?? "Actualidad"}`}
            source={imported.source}
            selected={item.selected}
            joins={completing && profile.experience.some((held) => sameJob(held, item.value))}
            missing={missingExperience(item.value)}
            delay={i * STAGGER_MS}
            onToggle={(selected) => update("experience", i, { selected })}
            fields={
              <ExperienceFields
                value={item.value}
                onChange={(changes) =>
                  update("experience", i, { value: { ...item.value, ...changes } })
                }
              />
            }
          />
        ))}
      </ReviewSection>

      <ReviewSection title="Educación" icon="graduation" count={review.education.length}>
        {review.education.map((item, i) => (
          <ReviewCard
            key={i}
            title={item.value.degree}
            subtitle={item.value.institution}
            period={`${item.value.startYear || "Sin año"} – ${item.value.endYear ?? "Actualidad"}`}
            source={imported.source}
            selected={item.selected}
            joins={completing && profile.education.some((held) => sameStudy(held, item.value))}
            missing={missingEducation(item.value)}
            delay={i * STAGGER_MS}
            onToggle={(selected) => update("education", i, { selected })}
            fields={
              <EducationFields
                value={item.value}
                onChange={(changes) =>
                  update("education", i, { value: { ...item.value, ...changes } })
                }
              />
            }
          />
        ))}
      </ReviewSection>

      <ReviewSection title="Habilidades" icon="sparkles" count={review.skills.length} list={false}>
        {fresh.length > 5 && (
          <button
            type="button"
            className={`${buttonClass("ghost", "sm")} self-start`}
            onClick={() => markFresh(!allFresh)}
          >
            <Icon name={allFresh ? "close" : "check"} size={14} />
            {allFresh ? "Desmarcar todas" : "Marcar todas"}
          </button>
        )}
        <div className="flex flex-wrap gap-2">
          {fresh.map((skill, i) => (
            <span
              key={skill.value}
              className="animate-pop"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <TogglePill
                on={skill.selected}
                onClick={() =>
                  update("skills", review.skills.indexOf(skill), { selected: !skill.selected })
                }
              >
                {skill.value}
              </TogglePill>
            </span>
          ))}
        </div>
        {known.length > 0 && (
          <p className="text-sm text-muted">
            <span className="font-bold text-mint-deep">Ya están en tu perfil, no se repiten:</span>{" "}
            {known.map((s) => s.value).join(", ")}
          </p>
        )}
      </ReviewSection>

      <Card className="sticky bottom-4 flex flex-wrap items-center justify-between gap-4 p-5 shadow-[0_18px_40px_-24px_rgba(124,0,255,0.45)]">
        <p className="text-sm text-muted" aria-live="polite">
          {error ? (
            <span className="font-bold text-danger" role="alert">
              {error}
            </span>
          ) : noIdentity ? (
            <span className="font-bold text-danger">
              Escribe tu nombre y un correo válido para continuar.
            </span>
          ) : blocked ? (
            <span className="font-bold text-danger">
              Completa los campos que faltan para continuar.
            </span>
          ) : nothing ? (
            "No hay nada marcado para guardar."
          ) : (
            <strong className="text-ink">
              {outcome({ mode, added: result.added, joined: result.joined })}
            </strong>
          )}
        </p>
        <button
          type="button"
          className={buttonClass("primary")}
          onClick={confirm}
          disabled={saving || blocked || nothing}
        >
          {saving ? "Guardando…" : completing ? "Completar mi perfil" : "Reemplazar mi perfil"}
          {!saving && <Icon name="check" size={16} strokeWidth={2.6} />}
        </button>
      </Card>
    </div>
  );
}

/** "2 cargos, 1 estudio y 5 habilidades", leaving out what is zero. */
function summary(added: ImportCounts): string {
  const parts = [
    added.experience > 0 && `${added.experience} ${plural(added.experience, "cargo", "cargos")}`,
    added.education > 0 && `${added.education} ${plural(added.education, "estudio", "estudios")}`,
    added.skills > 0 && `${added.skills} ${plural(added.skills, "habilidad", "habilidades")}`,
  ].filter((p): p is string => Boolean(p));
  return parts.length > 1
    ? `${parts.slice(0, -1).join(", ")} y ${parts.at(-1)}`
    : (parts[0] ?? "nada nuevo");
}

/** One sentence on what an import does to the profile. */
export function outcome({ mode, added, joined }: Saved): string {
  if (mode === "replace") return `Tu perfil queda con ${summary(added)}.`;
  const parts = [
    total(added) > 0 && `se agregan ${summary(added)}`,
    total(joined) > 0 && `se completan ${summary(joined)}`,
  ].filter((p): p is string => Boolean(p));
  const sentence = parts.join(" y ");
  return sentence ? `${sentence[0]?.toUpperCase()}${sentence.slice(1)}.` : "No hay nada nuevo.";
}

/**
 * Before and after on one bar: what the profile already has in navy, then what
 * the import adds in purple, or, when replacing would empty fields, that span
 * striped in red. The change is in points, so it never reads as "45% more",
 * and the fields behind it are named under the bar.
 */
function CompletenessDelta({
  before,
  after,
  gained,
  lost,
}: {
  before: number;
  after: number;
  gained: string[];
  lost: string[];
}) {
  const delta = after - before;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-2xl font-black text-navy">
          {before}% <span className="text-faint">→</span>{" "}
          <CountUp value={after} duration={900} />%
        </span>
        {delta !== 0 && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
              delta > 0 ? "bg-mint-wash text-mint-deep" : "bg-danger-wash text-danger"
            }`}
          >
            {delta > 0 ? "+" : "−"}
            {Math.abs(delta)} puntos
          </span>
        )}
      </div>
      <div
        className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full bg-brand-wash"
        role="img"
        aria-label={`Completitud del perfil: de ${before}% a ${after}%`}
      >
        <div className="h-full rounded-full bg-navy" style={{ width: `${Math.min(before, after)}%` }} />
        {delta !== 0 && (
          <div
            className={`h-full rounded-full ${
              delta > 0
                ? "bg-brand"
                : "bg-[repeating-linear-gradient(135deg,var(--color-danger)_0_3px,transparent_3px_6px)]"
            }`}
            style={{ width: `${Math.abs(delta)}%` }}
          />
        )}
      </div>
      {gained.length > 0 && (
        <p className="text-sm text-muted">
          Se llenan: <span className="font-bold text-ink">{gained.join(" · ")}</span>
        </p>
      )}
      {lost.length > 0 && (
        <p className="text-sm text-danger">
          Se vacían: <span className="font-bold">{lost.join(" · ")}</span>
        </p>
      )}
    </div>
  );
}

function ReviewSection({
  title,
  icon,
  count,
  list = true,
  children,
}: {
  title: string;
  icon: IconName;
  count: number;
  list?: boolean;
  children: ReactNode;
}) {
  return (
    <Card className="flex animate-rise flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-wash text-brand">
          <Icon name={icon} size={18} />
        </span>
        <h2 className="text-xl font-black text-slate">{title}</h2>
        <span className="text-sm font-bold text-muted tabular-nums">{count}</span>
      </div>
      {count === 0 ? (
        <p className="text-sm text-muted">No encontramos nada en esta sección.</p>
      ) : list ? (
        <ul className="flex flex-col gap-3">{children}</ul>
      ) : (
        children
      )}
    </Card>
  );
}
