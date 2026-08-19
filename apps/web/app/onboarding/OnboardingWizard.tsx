"use client";

import { Fragment, useState } from "react";
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
import { saveProfile } from "../../lib/client";
import { BLANK_EDUCATION, BLANK_EXPERIENCE, EducationStep, ExperienceStep } from "./entry-steps";
import { CompletenessRail } from "./fields";
import { BasicsStep, ExpectationsStep, SkillsStep } from "./steps";

/**
 * Five steps over one draft profile. Only this component holds the draft; the
 * step bodies below are given the slice they edit and a way to change it. That
 * is what lets the completeness bar be recomputed on every keystroke, from the
 * same function the dashboard reads.
 */

const STEPS = [
  {
    label: "Basics",
    title: "Who you are",
    blurb:
      "Name and city are the two that count toward completeness. Your city decides which on-site and hybrid vacancies can reach you.",
  },
  {
    label: "Skills",
    title: "What you can do",
    blurb:
      "Skills are what the score is built on. A must-have you hold is worth three times a nice-to-have.",
  },
  {
    label: "Experience",
    title: "Where you have worked",
    blurb:
      "Positions do not change the score yet. Recruiters read them, so keep the newest one first.",
  },
  {
    label: "Education",
    title: "What you studied",
    blurb: "One entry is enough. Add the degree you are finishing even if it is not awarded yet.",
  },
  {
    label: "Expectations",
    title: "What you are looking for",
    blurb:
      "The last three fields. They filter the list you are about to see, so be honest about the floor.",
  },
] as const;

const LAST_STEP = STEPS.length - 1;

export function OnboardingWizard({
  initial,
  vacancies,
}: {
  initial: Profile;
  vacancies: Vacancy[];
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(initial);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const current = STEPS[step] ?? STEPS[0];
  const completeness = profileCompleteness(profile);

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
      setError("Your name and your email are the two we cannot save without.");
      setStep(0);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await saveProfile({ ...profile, fullName, email });
      router.push("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your profile.");
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
    <div className="stack" style={{ gap: 22 }}>
      <div className="split" style={{ alignItems: "center" }}>
        <Stepper step={step} onGo={setStep} />
        <span className="meta num" style={{ whiteSpace: "nowrap" }}>
          Step {step + 1} of {STEPS.length}
        </span>
      </div>

      <div className="two-col">
        <section className="panel stack" style={{ gap: 20 }}>
          <div className="stack" style={{ gap: 6 }}>
            <h1 className="display" style={{ fontSize: 34 }}>
              {current.title}
            </h1>
            <p className="lead" style={{ fontSize: 14, maxWidth: "52ch" }}>
              {current.blurb}
            </p>
          </div>

          <div className="stack grow" style={{ gap: 18 }}>
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

          <div
            className="row"
            style={{
              justifyContent: "space-between",
              gap: 16,
              paddingTop: 18,
              borderTop: "1px solid var(--line)",
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0 || saving}
            >
              <Icon name="arrowLeft" size={16} strokeWidth={2.4} />
              Back
            </button>

            <div className="row" style={{ gap: 14 }}>
              <span className="meta" style={{ textAlign: "right" }}>
                {step === LAST_STEP
                  ? "This is what we save."
                  : "Nothing is stored until the last step."}
              </span>
              <button type="button" className="btn btn--primary" onClick={goNext} disabled={saving}>
                {saving ? "Saving…" : step === LAST_STEP ? "See my matches" : "Continue"}
                <Icon name="arrowRight" size={16} strokeWidth={2.4} />
              </button>
            </div>
          </div>

          {error && (
            <p className="lead" role="alert" style={{ color: "var(--gold)" }}>
              {error}
            </p>
          )}
        </section>

        <CompletenessRail completeness={completeness} />
      </div>
    </div>
  );
}

function Stepper({ step, onGo }: { step: number; onGo: (index: number) => void }) {
  return (
    <div className="steps">
      {STEPS.map((s, i) => (
        <Fragment key={s.label}>
          {i > 0 && <span className="step__rule" />}
          <button
            type="button"
            onClick={() => onGo(i)}
            aria-current={i === step ? "step" : undefined}
            className={`step${i === step ? " step--active" : i < step ? " step--done" : ""}`}
            style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}
          >
            <span className="step__dot">
              {i < step ? (
                <Icon name="check" size={12} strokeWidth={3} />
              ) : (
                <span className="num">{i + 1}</span>
              )}
            </span>
            {s.label}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
