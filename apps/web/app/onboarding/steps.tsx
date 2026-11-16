"use client";

import type { Expectations, Profile, Vacancy, WorkMode } from "@moonlight/types";
import {
  DEFAULT_CURRENCY,
  SENIORITIES,
  TARGET_AREAS,
  marketGaps,
  normalizeSkill,
} from "@moonlight/core";

import { Icon } from "../../components/Icon";
import { Field, TogglePill, inputClass } from "../../components/primitives";
import { WORK_MODES } from "../../components/work-modes";
import { salaryRange, workModeLabel } from "../../lib/format";
import { ChipInput, FieldGrid, optionalNumber } from "./fields";

const CURRENCIES = [DEFAULT_CURRENCY, "USD", "EUR"];

export function BasicsStep({
  profile,
  onPatch,
}: {
  profile: Profile;
  onPatch: (changes: Partial<Profile>) => void;
}) {
  return (
    <FieldGrid>
      <div className="sm:col-span-2">
        <Field label="Nombre completo">
          <input
            className={inputClass}
            value={profile.fullName}
            onChange={(e) => onPatch({ fullName: e.target.value })}
            placeholder="Ana Gómez"
            autoComplete="name"
          />
        </Field>
      </div>
      <Field label="Correo">
        <input
          className={inputClass}
          type="email"
          value={profile.email}
          onChange={(e) => onPatch({ email: e.target.value })}
          placeholder="ana.gomez@ejemplo.com"
          autoComplete="email"
        />
      </Field>
      <Field label="Ciudad" hint="Donde vives hoy, no adonde te mudarías.">
        <input
          className={inputClass}
          value={profile.city ?? ""}
          onChange={(e) => onPatch({ city: e.target.value })}
          placeholder="Medellín"
          autoComplete="address-level2"
        />
      </Field>
    </FieldGrid>
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
    <div className="flex flex-col gap-6">
      <ChipInput
        label="Tus habilidades"
        placeholder="Escribe una habilidad y presiona Enter"
        values={profile.skills.map((s) => s.name)}
        normalize={normalizeSkill}
        onChange={onSetSkills}
      />

      {suggested.length > 0 && (
        <div className="flex flex-col gap-3 rounded-3xl bg-brand-wash/60 p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-brand">
            <Icon name="sparkles" size={16} />
            Sugeridas por el mercado
          </p>
          <p className="-mt-2 text-xs text-muted">
            Las más pedidas que aún no tienes, en {vacancies.length}{" "}
            {vacancies.length === 1 ? "vacante abierta" : "vacantes abiertas"}.
          </p>
          <div className="flex flex-wrap gap-2">
            {suggested.map((gap) => (
              <button
                key={gap.skill}
                type="button"
                onClick={() => onAddSkill(gap.skill)}
                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-brand/50 bg-canvas px-3 py-1.5 text-[13px] font-bold text-ink transition hover:-translate-y-0.5 hover:border-brand hover:text-brand"
              >
                <Icon name="plus" size={13} strokeWidth={2.6} />
                {gap.skill}
                <span className="font-normal text-muted tabular-nums">{gap.sharePercent}%</span>
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
    <div className="flex flex-col gap-6">
      <FieldGrid>
        <div className="sm:col-span-2">
          <Field label="Cargo objetivo">
            <input
              className={inputClass}
              value={expectations.targetRole ?? ""}
              onChange={(e) => onPatch({ targetRole: e.target.value })}
              placeholder="Desarrollador full stack"
            />
          </Field>
        </div>
        <SelectField
          label="Área"
          value={expectations.targetArea ?? ""}
          options={TARGET_AREAS}
          placeholder="Elige un área"
          onChange={(value) => onPatch({ targetArea: value || undefined })}
        />
        <SelectField
          label="Nivel"
          value={expectations.targetSeniority ?? ""}
          options={SENIORITIES}
          placeholder="Elige un nivel"
          onChange={(value) => onPatch({ targetSeniority: value || undefined })}
        />
      </FieldGrid>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-bold text-ink">Salario mensual</span>
          <span className="text-sm font-black text-navy tabular-nums">
            {salaryRange(expectations)}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px]">
          <Field label="Mínimo">
            <input
              className={`${inputClass} tabular-nums`}
              type="number"
              min={0}
              step={100000}
              value={expectations.salaryMin ?? ""}
              onChange={(e) => onPatch({ salaryMin: optionalNumber(e.target.value) })}
              placeholder="7000000"
            />
          </Field>
          <Field label="Máximo">
            <input
              className={`${inputClass} tabular-nums`}
              type="number"
              min={0}
              step={100000}
              value={expectations.salaryMax ?? ""}
              onChange={(e) => onPatch({ salaryMax: optionalNumber(e.target.value) })}
              placeholder="11000000"
            />
          </Field>
          <SelectField
            label="Moneda"
            value={expectations.currency ?? DEFAULT_CURRENCY}
            options={CURRENCIES}
            onChange={(currency) => onPatch({ currency })}
          />
        </div>
      </div>

      <Field label="Modalidad" group>
        <div className="flex flex-wrap gap-2">
          {WORK_MODES.map((mode) => (
            <TogglePill
              key={mode}
              on={expectations.workModes.includes(mode)}
              onClick={() => onToggleWorkMode(mode)}
            >
              {workModeLabel(mode)}
            </TogglePill>
          ))}
        </div>
      </Field>

      {/* Two buttons rather than a checkbox, so "not answered yet" can exist
          and does not count toward completeness. */}
      <Field
        label="¿Estás dispuesto a reubicarte?"
        hint="Si dices que sí, te preguntamos a qué ciudades."
        group
      >
        <div className="flex flex-wrap gap-2">
          <TogglePill
            on={expectations.willRelocate === true}
            onClick={() => onPatch({ willRelocate: true })}
          >
            Sí
          </TogglePill>
          {/* Saying no drops the cities: a relocation with none is an
              incomplete field, and a hidden one cannot be fixed. */}
          <TogglePill
            on={expectations.willRelocate === false}
            onClick={() => onPatch({ willRelocate: false, cities: [] })}
          >
            No
          </TogglePill>
        </div>
      </Field>

      {expectations.willRelocate === true && (
        <ChipInput
          label="Ciudades a las que te mudarías"
          placeholder="Escribe una ciudad y presiona Enter"
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
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
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
