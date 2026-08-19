"use client";

import type { Expectations, Profile, Vacancy, WorkMode } from "@moonlight/types";
import { marketGaps, normalizeSkill } from "@moonlight/core";

import { Icon } from "../../components/Icon";
import { Field } from "../../components/primitives";
import { WORK_MODES } from "../../components/work-modes";
import { salaryRange, workModeLabel } from "../../lib/format";
import { ChipInput, optionalNumber } from "./fields";

const CURRENCIES = ["COP", "USD", "EUR"];

export function BasicsStep({
  profile,
  onPatch,
}: {
  profile: Profile;
  onPatch: (changes: Partial<Profile>) => void;
}) {
  return (
    <div className="two-fields">
      <div style={{ gridColumn: "span 2" }}>
        <Field label="Full name">
          <input
            className="input"
            value={profile.fullName}
            onChange={(e) => onPatch({ fullName: e.target.value })}
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
          onChange={(e) => onPatch({ email: e.target.value })}
          placeholder="ana.gomez@example.com"
          autoComplete="email"
        />
      </Field>
      <Field label="City" hint="Where you live today, not where you would move.">
        <input
          className="input"
          value={profile.city ?? ""}
          onChange={(e) => onPatch({ city: e.target.value })}
          placeholder="Medellín"
          autoComplete="address-level2"
        />
      </Field>
    </div>
  );
}

/** Skills, plus the market gaps the candidate can close in one click. */
export function SkillsStep({
  profile,
  vacancies,
  onSetSkills,
  onAddSkill,
}: {
  profile: Profile;
  vacancies: Vacancy[];
  onSetSkills: (names: string[]) => void;
  onAddSkill: (name: string) => void;
}) {
  const suggested = marketGaps(profile, vacancies).slice(0, 6);

  return (
    <div className="stack" style={{ gap: 24 }}>
      <ChipInput
        label="Your skills"
        placeholder="Type a skill and press Enter"
        values={profile.skills.map((s) => s.name)}
        normalize={normalizeSkill}
        onChange={onSetSkills}
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
                className="chip chip--dashed chip--action"
                onClick={() => onAddSkill(gap.skill)}
              >
                <span style={{ color: "var(--gold-text)", display: "flex" }}>
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

export function ExpectationsStep({
  expectations,
  onPatch,
  onToggleWorkMode,
}: {
  expectations: Expectations;
  onPatch: (changes: Partial<Expectations>) => void;
  onToggleWorkMode: (mode: WorkMode) => void;
}) {
  return (
    <div className="stack" style={{ gap: 20 }}>
      <Field label="Target role">
        <input
          className="input"
          value={expectations.targetRole ?? ""}
          onChange={(e) => onPatch({ targetRole: e.target.value })}
          placeholder="Full Stack Developer"
        />
      </Field>

      <div className="stack" style={{ gap: 9 }}>
        <div className="split">
          <span className="field__label">Salary range, monthly</span>
          <span className="num" style={{ fontSize: 13.5, color: "var(--ink-active)" }}>
            {salaryRange(expectations)}
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) 120px",
            gap: 16,
          }}
        >
          <Field label="Minimum">
            <input
              className="input num"
              type="number"
              min={0}
              step={100000}
              value={expectations.salaryMin ?? ""}
              onChange={(e) => onPatch({ salaryMin: optionalNumber(e.target.value) })}
              placeholder="7000000"
            />
          </Field>
          <Field label="Maximum">
            <input
              className="input num"
              type="number"
              min={0}
              step={100000}
              value={expectations.salaryMax ?? ""}
              onChange={(e) => onPatch({ salaryMax: optionalNumber(e.target.value) })}
              placeholder="11000000"
            />
          </Field>
          <Field label="Currency">
            <select
              className="select"
              value={expectations.currency ?? "COP"}
              onChange={(e) => onPatch({ currency: e.target.value })}
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

      {/* A <label> around a row of buttons points at nothing, so this is a
          named group instead. */}
      <div className="stack" style={{ gap: 9 }} role="group" aria-label="Work mode">
        <span className="field__label">Work mode</span>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          {WORK_MODES.map((mode) => {
            const on = expectations.workModes.includes(mode);
            return (
              <button
                key={mode}
                type="button"
                className="chip chip--action"
                aria-pressed={on}
                onClick={() => onToggleWorkMode(mode)}
                style={{ height: 40, padding: "0 18px", fontSize: 13.5 }}
              >
                {workModeLabel(mode)}
              </button>
            );
          })}
        </div>
      </div>

      {/* The question is inside the label, so the box is announced as "Willing
          to relocate". The Yes/No beside it only repeats the checked state. */}
      <label
        className="row"
        style={{
          justifyContent: "space-between",
          padding: "14px 16px",
          border: "1px solid var(--line)",
          borderRadius: 10,
          background: "var(--panel)",
          cursor: "pointer",
        }}
      >
        <span className="stack" style={{ gap: 3 }}>
          <span style={{ fontSize: 14 }}>Willing to relocate</span>
          <span className="meta">Say yes and we ask which cities.</span>
        </span>
        <span className="check">
          <input
            type="checkbox"
            checked={expectations.willRelocate}
            // Saying no drops the cities: a relocation with none is an
            // incomplete field, and a hidden one cannot be fixed.
            onChange={(e) =>
              onPatch(
                e.target.checked ? { willRelocate: true } : { willRelocate: false, cities: [] },
              )
            }
          />
          {expectations.willRelocate ? "Yes" : "No"}
        </span>
      </label>

      {expectations.willRelocate && (
        <ChipInput
          label="Cities you would move to"
          placeholder="Type a city and press Enter"
          values={expectations.cities}
          normalize={(value) => value.trim().toLowerCase()}
          onChange={(cities) => onPatch({ cities })}
        />
      )}
    </div>
  );
}
