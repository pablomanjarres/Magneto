"use client";

import type { ReactNode } from "react";
import type { Expectations, Profile, Vacancy, WorkMode } from "@moonlight/types";
import {
  DEFAULT_CURRENCY,
  SENIORITIES,
  TARGET_AREAS,
  marketGaps,
  normalizeSkill,
} from "@moonlight/core";

import { Icon } from "../../components/Icon";
import { Field } from "../../components/primitives";
import { WORK_MODES } from "../../components/work-modes";
import { salaryRange, workModeLabel } from "../../lib/format";
import { ChipInput, optionalNumber } from "./fields";

const CURRENCIES = [DEFAULT_CURRENCY, "USD", "EUR"];

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
                <span style={{ color: "var(--gold-deep)", display: "flex" }}>
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
      <div className="two-fields">
        <div style={{ gridColumn: "span 2" }}>
          <Field label="Target role">
            <input
              className="input"
              value={expectations.targetRole ?? ""}
              onChange={(e) => onPatch({ targetRole: e.target.value })}
              placeholder="Full Stack Developer"
            />
          </Field>
        </div>
        <SelectField
          label="Area"
          value={expectations.targetArea ?? ""}
          options={TARGET_AREAS}
          placeholder="Choose an area"
          onChange={(value) => onPatch({ targetArea: value || undefined })}
        />
        <SelectField
          label="Seniority"
          value={expectations.targetSeniority ?? ""}
          options={SENIORITIES}
          placeholder="Choose a level"
          onChange={(value) => onPatch({ targetSeniority: value || undefined })}
        />
      </div>

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
          <SelectField
            label="Currency"
            value={expectations.currency ?? DEFAULT_CURRENCY}
            options={CURRENCIES}
            onChange={(currency) => onPatch({ currency })}
          />
        </div>
      </div>

      {/* A <label> around a row of buttons points at nothing, so this is a
          named group instead. */}
      <div className="stack" style={{ gap: 9 }} role="group" aria-label="Work mode">
        <span className="field__label">Work mode</span>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          {WORK_MODES.map((mode) => (
            <ChoiceChip
              key={mode}
              on={expectations.workModes.includes(mode)}
              onClick={() => onToggleWorkMode(mode)}
            >
              {workModeLabel(mode)}
            </ChoiceChip>
          ))}
        </div>
      </div>

      {/* Two buttons rather than a checkbox, so "not answered yet" can exist
          and does not count toward completeness. */}
      <div className="stack" style={{ gap: 9 }} role="group" aria-label="Willing to relocate">
        <span className="field__label">Willing to relocate</span>
        <span className="meta">Say yes and we ask which cities.</span>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <ChoiceChip
            on={expectations.willRelocate === true}
            onClick={() => onPatch({ willRelocate: true })}
          >
            Yes
          </ChoiceChip>
          {/* Saying no drops the cities: a relocation with none is an
              incomplete field, and a hidden one cannot be fixed. */}
          <ChoiceChip
            on={expectations.willRelocate === false}
            onClick={() => onPatch({ willRelocate: false, cities: [] })}
          >
            No
          </ChoiceChip>
        </div>
      </div>

      {expectations.willRelocate === true && (
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

/** One answer from a fixed list. A placeholder adds an empty choice that means "not chosen". */
function SelectField({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** A pressable chip for picking one or more answers from a short list. */
function ChoiceChip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="chip chip--action"
      aria-pressed={on}
      onClick={onClick}
      style={{ height: 40, padding: "0 18px", fontSize: 13.5 }}
    >
      {children}
    </button>
  );
}
