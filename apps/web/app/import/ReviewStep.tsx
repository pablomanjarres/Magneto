"use client";

import { useState, type ReactNode } from "react";
import type { ImportedProfile, Profile } from "@moonlight/types";
import { mergeImport, profileCompleteness } from "@moonlight/core";

import { CountUp } from "../../components/CountUp";
import { Icon, type IconName } from "../../components/Icon";
import { Card, Eyebrow, ProgressBar, TogglePill, buttonClass } from "../../components/primitives";
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

export type Added = ReturnType<typeof mergeImport>["added"];

/** Each card pops in a beat after the one before it. */
const STAGGER_MS = 70;

export function ReviewStep({
  profile,
  imported,
  onSaved,
}: {
  profile: Profile;
  imported: ImportedProfile;
  onSaved: (added: Added) => void;
}) {
  const [review, setReview] = useState<ReviewState>(() => initialReview(profile, imported));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const merged = mergeImport(profile, selection(imported, review));
  const before = profileCompleteness(profile).percentage;
  const after = profileCompleteness(merged.profile).percentage;
  const blocked = isBlocked(review);
  const nothing = merged.added.experience + merged.added.education + merged.added.skills === 0;

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
      await saveProfile(merged.profile);
      onSaved(merged.added);
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
  const fresh = review.skills.filter((s) => !s.exists);
  const known = review.skills.filter((s) => s.exists);

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
          <Completeness label="Ahora" value={before} />
          <Completeness label="Con lo importado" value={after} accent />
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
            exists={item.exists}
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
            exists={item.exists}
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
