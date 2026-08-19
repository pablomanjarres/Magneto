"use client";

import { Fragment, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Education, Experience, Profile, Vacancy, WorkMode } from "@moonlight/types";
import { COMPLETENESS_FIELDS, marketGaps, normalizeSkill, profileCompleteness } from "@moonlight/core";

import { Icon } from "../../components/Icon";
import { EmptyState, Field, ProgressBar } from "../../components/primitives";
import { saveProfile } from "../../lib/client";
import { salaryRange, workModeLabel } from "../../lib/format";

/**
 * Five steps over one draft profile. The draft never leaves this component
 * until the last Continue, so the completeness bar can be recomputed on every
 * keystroke from the same function the dashboard reads.
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
const WORK_MODES: readonly WorkMode[] = ["remote", "hybrid", "onsite"];
const CURRENCIES = ["COP", "USD", "EUR"];

const BLANK_EXPERIENCE: Experience = {
  company: "",
  title: "",
  startDate: "",
  endDate: undefined,
  description: undefined,
};

const BLANK_EDUCATION: Education = {
  institution: "",
  degree: "",
  startYear: new Date().getUTCFullYear(),
  endYear: undefined,
};

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
  const filled = COMPLETENESS_FIELDS.length - completeness.missing.length;

  function patch(changes: Partial<Profile>): void {
    setProfile((p) => ({ ...p, ...changes }));
  }

  function patchExpectations(changes: Partial<Profile["expectations"]>): void {
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
      const on = p.expectations.workModes.includes(mode);
      return {
        ...p,
        expectations: {
          ...p.expectations,
          workModes: on
            ? p.expectations.workModes.filter((m) => m !== mode)
            : [...p.expectations.workModes, mode],
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

  const goNext = (): void => {
    if (step === LAST_STEP) {
      void finish();
    } else {
      setError(null);
      setStep(step + 1);
    }
  };

  return (
    <div className="stack" style={{ gap: 22 }}>
      <div className="split" style={{ alignItems: "center" }}>
        <div className="steps">
          {STEPS.map((s, i) => (
            <Fragment key={s.label}>
              {i > 0 && <span className="step__rule" />}
              <button
                type="button"
                onClick={() => setStep(i)}
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
            {step === 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "18px 20px" }}>
                <div style={{ gridColumn: "span 2" }}>
                  <Field label="Full name">
                    <input
                      className="input"
                      value={profile.fullName}
                      onChange={(e) => patch({ fullName: e.target.value })}
                      placeholder="Ana Gómez"
                      autoComplete="name"
                    />
                  </Field>
                </div>
                <Field label="Email">
                  <input
                    className="input"
                    type="email"
                    value={profile.email}
                    onChange={(e) => patch({ email: e.target.value })}
                    placeholder="ana.gomez@example.com"
                    autoComplete="email"
                  />
                </Field>
                <Field label="City" hint="Where you live today, not where you would move.">
                  <input
                    className="input"
                    value={profile.city ?? ""}
                    onChange={(e) => patch({ city: e.target.value })}
                    placeholder="Medellín"
                    autoComplete="address-level2"
                  />
                </Field>
              </div>
            )}

            {step === 1 && (
              <SkillsStep
                profile={profile}
                vacancies={vacancies}
                onChange={(names) => patch({ skills: names.map((name) => ({ name })) })}
                onAdd={addSkill}
              />
            )}

            {step === 2 && (
              <div className="stack" style={{ gap: 12 }}>
                {profile.experience.length === 0 && (
                  <EmptyState title="No positions yet">
                    Add the one you are in now. An unfinished job is still a position — leave the
                    end date empty.
                  </EmptyState>
                )}

                {profile.experience.map((item, index) => (
                  <EntryCard
                    key={index}
                    removeLabel="Remove this position"
                    onRemove={() =>
                      patch({ experience: profile.experience.filter((_, i) => i !== index) })
                    }
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px 16px" }}>
                      <Field label="Company">
                        <input
                          className="input"
                          value={item.company}
                          onChange={(e) => updateExperience(index, { company: e.target.value })}
                          placeholder="Sofka Technologies"
                        />
                      </Field>
                      <Field label="Title">
                        <input
                          className="input"
                          value={item.title}
                          onChange={(e) => updateExperience(index, { title: e.target.value })}
                          placeholder="Frontend Developer"
                        />
                      </Field>
                      <Field label="Start date">
                        <input
                          className="input"
                          type="month"
                          value={item.startDate}
                          onChange={(e) => updateExperience(index, { startDate: e.target.value })}
                        />
                      </Field>
                      <Field label="End date" hint="Leave empty if you still work here.">
                        <input
                          className="input"
                          type="month"
                          value={item.endDate ?? ""}
                          onChange={(e) =>
                            updateExperience(index, {
                              endDate: e.target.value === "" ? undefined : e.target.value,
                            })
                          }
                        />
                      </Field>
                    </div>
                    <Field label="Description">
                      <textarea
                        className="textarea"
                        value={item.description ?? ""}
                        onChange={(e) =>
                          updateExperience(index, {
                            description: e.target.value === "" ? undefined : e.target.value,
                          })
                        }
                        placeholder="React and TypeScript on an internal banking portal."
                      />
                    </Field>
                  </EntryCard>
                ))}

                <AddButton
                  label="Add a position"
                  onClick={() => patch({ experience: [...profile.experience, BLANK_EXPERIENCE] })}
                />
              </div>
            )}

            {step === 3 && (
              <div className="stack" style={{ gap: 12 }}>
                {profile.education.length === 0 && (
                  <EmptyState title="No studies yet">
                    One entry is enough, and the degree you are still finishing counts.
                  </EmptyState>
                )}

                {profile.education.map((item, index) => (
                  <EntryCard
                    key={index}
                    removeLabel="Remove this degree"
                    onRemove={() =>
                      patch({ education: profile.education.filter((_, i) => i !== index) })
                    }
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px 16px" }}>
                      <Field label="Institution">
                        <input
                          className="input"
                          value={item.institution}
                          onChange={(e) => updateEducation(index, { institution: e.target.value })}
                          placeholder="Universidad EAFIT"
                        />
                      </Field>
                      <Field label="Degree">
                        <input
                          className="input"
                          value={item.degree}
                          onChange={(e) => updateEducation(index, { degree: e.target.value })}
                          placeholder="Ingeniería de Sistemas"
                        />
                      </Field>
                      <Field label="Start year">
                        <input
                          className="input num"
                          type="number"
                          min={1950}
                          max={2100}
                          value={item.startYear === 0 ? "" : item.startYear}
                          onChange={(e) =>
                            updateEducation(index, { startYear: Number(e.target.value) || 0 })
                          }
                        />
                      </Field>
                      <Field label="End year" hint="Leave empty if you have not finished.">
                        <input
                          className="input num"
                          type="number"
                          min={1950}
                          max={2100}
                          value={item.endYear ?? ""}
                          onChange={(e) =>
                            updateEducation(index, {
                              endYear: e.target.value === "" ? undefined : Number(e.target.value),
                            })
                          }
                        />
                      </Field>
                    </div>
                  </EntryCard>
                ))}

                <AddButton
                  label="Add a degree"
                  onClick={() => patch({ education: [...profile.education, BLANK_EDUCATION] })}
                />
              </div>
            )}

            {step === 4 && (
              <div className="stack" style={{ gap: 20 }}>
                <Field label="Target role">
                  <input
                    className="input"
                    value={profile.expectations.targetRole ?? ""}
                    onChange={(e) => patchExpectations({ targetRole: e.target.value })}
                    placeholder="Full Stack Developer"
                  />
                </Field>

                <div className="stack" style={{ gap: 9 }}>
                  <div className="split">
                    <span className="field__label">Salary range, monthly</span>
                    <span className="num" style={{ fontSize: 13.5, color: "var(--ink-active)" }}>
                      {salaryRange(profile.expectations)}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) 120px", gap: 16 }}>
                    <Field label="Minimum">
                      <input
                        className="input num"
                        type="number"
                        min={0}
                        step={100000}
                        value={profile.expectations.salaryMin ?? ""}
                        onChange={(e) =>
                          patchExpectations({
                            salaryMin: e.target.value === "" ? undefined : Number(e.target.value),
                          })
                        }
                        placeholder="7000000"
                      />
                    </Field>
                    <Field label="Maximum">
                      <input
                        className="input num"
                        type="number"
                        min={0}
                        step={100000}
                        value={profile.expectations.salaryMax ?? ""}
                        onChange={(e) =>
                          patchExpectations({
                            salaryMax: e.target.value === "" ? undefined : Number(e.target.value),
                          })
                        }
                        placeholder="11000000"
                      />
                    </Field>
                    <Field label="Currency">
                      <select
                        className="select"
                        value={profile.expectations.currency ?? "COP"}
                        onChange={(e) => patchExpectations({ currency: e.target.value })}
                      >
                        {CURRENCIES.map((code) => (
                          <option key={code} value={code}>
                            {code}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>

                <div className="stack" style={{ gap: 9 }}>
                  <span className="field__label">Work mode</span>
                  <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                    {WORK_MODES.map((mode) => {
                      const on = profile.expectations.workModes.includes(mode);
                      return (
                        <button
                          key={mode}
                          type="button"
                          className="chip"
                          aria-pressed={on}
                          onClick={() => toggleWorkMode(mode)}
                          style={{
                            height: 40,
                            padding: "0 18px",
                            fontSize: 13.5,
                            cursor: "pointer",
                            borderColor: on ? "var(--glow)" : "var(--line-strong)",
                            background: on ? "var(--wash)" : "transparent",
                            color: on ? "var(--ink-active)" : "var(--muted)",
                          }}
                        >
                          {workModeLabel(mode)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  className="row"
                  style={{
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    background: "var(--panel)",
                  }}
                >
                  <span className="stack" style={{ gap: 3 }}>
                    <span style={{ fontSize: 14 }}>Willing to relocate</span>
                    <span className="meta">Say yes and we ask which cities.</span>
                  </span>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={profile.expectations.willRelocate}
                      onChange={(e) =>
                        // Saying no drops the cities: a relocation with none is
                        // an incomplete field, and a hidden one cannot be fixed.
                        patchExpectations(
                          e.target.checked
                            ? { willRelocate: true }
                            : { willRelocate: false, cities: [] },
                        )
                      }
                    />
                    {profile.expectations.willRelocate ? "Yes" : "No"}
                  </label>
                </div>

                {profile.expectations.willRelocate && (
                  <ChipInput
                    label="Cities you would move to"
                    placeholder="Type a city and press Enter"
                    values={profile.expectations.cities}
                    normalize={(value) => value.trim().toLowerCase()}
                    onChange={(cities) => patchExpectations({ cities })}
                  />
                )}
              </div>
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
            <p className="lead" role="alert" style={{ color: "var(--gold)", margin: 0 }}>
              {error}
            </p>
          )}
        </section>

        <aside className="card stack" style={{ gap: 18, padding: "20px 22px" }}>
          <span
            style={{
              fontSize: 11,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: "var(--faint)",
            }}
          >
            Profile completeness
          </span>

          <div className="stack" style={{ gap: 10 }}>
            <div className="row" style={{ alignItems: "baseline", gap: 8 }}>
              <span
                className="display num"
                style={{ fontSize: 46, lineHeight: 1, color: "var(--gold)" }}
              >
                {completeness.percentage}
              </span>
              <span style={{ fontSize: 18, color: "var(--gold)" }}>%</span>
              <span className="meta num" style={{ marginLeft: "auto" }}>
                {filled} of {COMPLETENESS_FIELDS.length} fields
              </span>
            </div>
            <ProgressBar percentage={completeness.percentage} />
          </div>

          <div className="stack" style={{ gap: 9 }}>
            <span className="field__label">Still missing</span>
            {completeness.missing.length === 0 ? (
              <span className="row" style={{ gap: 9, fontSize: 13, color: "var(--glow)" }}>
                <Icon name="check" size={14} strokeWidth={2.6} />
                Nothing left. Every field is filled.
              </span>
            ) : (
              completeness.missing.map((label) => (
                <span
                  key={label}
                  className="row"
                  style={{ gap: 9, fontSize: 13, color: "var(--ink-secondary)" }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      border: "1px solid var(--dim)",
                      flexShrink: 0,
                    }}
                  />
                  {label}
                </span>
              ))
            )}
          </div>

          <div
            className="stack"
            style={{
              gap: 6,
              padding: "14px 16px",
              border: "1px solid var(--line-strong)",
              borderRadius: 10,
              background: "var(--ground)",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--glow)" }}>Why this bar matters</span>
            <span className="lead">
              A finished profile is scored against every open vacancy. Each empty field is a match
              we cannot compute for you.
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}

/** Skills, plus the market gaps the candidate can close with one click. */
function SkillsStep({
  profile,
  vacancies,
  onChange,
  onAdd,
}: {
  profile: Profile;
  vacancies: Vacancy[];
  onChange: (names: string[]) => void;
  onAdd: (name: string) => void;
}) {
  const suggested = marketGaps(profile, vacancies).slice(0, 6);

  return (
    <div className="stack" style={{ gap: 24 }}>
      <ChipInput
        label="Your skills"
        placeholder="Type a skill and press Enter"
        values={profile.skills.map((s) => s.name)}
        normalize={normalizeSkill}
        onChange={onChange}
      />

      {suggested.length > 0 && (
        <div className="stack" style={{ gap: 10 }}>
          <div className="row" style={{ alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--glow)" }}>Suggested by the market</span>
            <span className="meta">
              most-asked skills you have not listed, across {vacancies.length} open{" "}
              {vacancies.length === 1 ? "vacancy" : "vacancies"}
            </span>
          </div>
          <div className="chips">
            {suggested.map((gap) => (
              <button
                key={gap.skill}
                type="button"
                className="chip chip--dashed"
                onClick={() => onAdd(gap.skill)}
                style={{ cursor: "pointer", background: "transparent" }}
              >
                <span style={{ color: "var(--gold)", display: "flex" }}>
                  <Icon name="plus" size={13} strokeWidth={2.4} />
                </span>
                {gap.skill}
                <span className="meta num">{gap.sharePercent}%</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * One box of removable chips fed by a text input. Skills and relocation cities
 * are the same interaction, so they are the same component.
 */
function ChipInput({
  label,
  placeholder,
  values,
  normalize,
  onChange,
}: {
  label: string;
  placeholder: string;
  values: string[];
  normalize: (value: string) => string;
  onChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add(): void {
    const value = draft.trim();
    if (value.length === 0) return;
    if (!values.some((held) => normalize(held) === normalize(value))) onChange([...values, value]);
    setDraft("");
  }

  return (
    <div className="stack" style={{ gap: 10 }}>
      <span className="field__label">{label}</span>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignContent: "flex-start",
          gap: 8,
          padding: 12,
          minHeight: 96,
          border: "1px solid var(--line-strong)",
          borderRadius: 10,
          background: "var(--panel)",
        }}
      >
        {values.map((value) => (
          <span
            key={value}
            className="chip"
            style={{
              height: 32,
              padding: "0 6px 0 12px",
              fontSize: 13,
              gap: 8,
              color: "var(--ink-active)",
              background: "var(--wash)",
            }}
          >
            {value}
            <button
              type="button"
              aria-label={`Remove ${value}`}
              onClick={() => onChange(values.filter((held) => held !== value))}
              style={{
                display: "flex",
                background: "none",
                border: 0,
                padding: 4,
                cursor: "pointer",
                color: "var(--gold)",
              }}
            >
              <Icon name="close" size={12} strokeWidth={2.4} />
            </button>
          </span>
        ))}

        <input
          className="input"
          aria-label={label}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          style={{
            flex: "1 1 180px",
            width: "auto",
            height: 32,
            padding: "0 6px",
            border: 0,
            background: "transparent",
            fontSize: 13,
          }}
        />
        <button type="button" className="btn btn--sm" onClick={add} disabled={draft.trim() === ""}>
          Add
        </button>
      </div>
    </div>
  );
}

/** A repeatable block: the accent bar, the fields, and the one way out. */
function EntryCard({
  removeLabel,
  onRemove,
  children,
}: {
  removeLabel: string;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="card row" style={{ gap: 14, alignItems: "stretch", padding: "16px 18px" }}>
      <span style={{ width: 3, borderRadius: 2, background: "var(--glow)", flexShrink: 0 }} />
      <div className="stack grow" style={{ gap: 14 }}>
        {children}
      </div>
      <button
        type="button"
        className="btn btn--sm"
        aria-label={removeLabel}
        title={removeLabel}
        onClick={onRemove}
        style={{ alignSelf: "flex-start" }}
      >
        <Icon name="close" size={13} strokeWidth={2.4} />
      </button>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="row"
      onClick={onClick}
      style={{
        justifyContent: "center",
        gap: 8,
        width: "100%",
        height: 48,
        border: "1px dashed var(--line-dashed)",
        borderRadius: 10,
        background: "transparent",
        color: "var(--muted)",
        fontSize: 13.5,
        cursor: "pointer",
      }}
    >
      <span style={{ color: "var(--gold)", display: "flex" }}>
        <Icon name="plus" size={16} strokeWidth={2.2} />
      </span>
      {label}
    </button>
  );
}
