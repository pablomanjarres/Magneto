"use client";

import type { Education, Experience } from "@moonlight/types";

import { EmptyState, Field, inputClass, textareaClass } from "../../components/primitives";
import { AddButton, EntryCard, FieldGrid, optionalNumber, optionalText } from "./fields";

export const BLANK_EXPERIENCE: Experience = {
  company: "",
  title: "",
  startDate: "",
  endDate: undefined,
  description: undefined,
};

export const BLANK_EDUCATION: Education = {
  institution: "",
  degree: "",
  startYear: 0,
  endYear: undefined,
};

export function ExperienceStep({
  items,
  onUpdate,
  onAdd,
  onRemove,
}: {
  items: Experience[];
  onUpdate: (index: number, changes: Partial<Experience>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 && (
        <EmptyState title="Aún no tienes cargos">
          Agrega el que tienes hoy. Un trabajo en curso también cuenta: deja vacía la fecha de fin.
        </EmptyState>
      )}

      {items.map((item, index) => (
        <EntryCard key={index} removeLabel="Quitar cargo" onRemove={() => onRemove(index)}>
          <ExperienceFields value={item} onChange={(changes) => onUpdate(index, changes)} />
        </EntryCard>
      ))}

      <AddButton label="Agregar cargo" onClick={onAdd} />
    </div>
  );
}

export function EducationStep({
  items,
  onUpdate,
  onAdd,
  onRemove,
}: {
  items: Education[];
  onUpdate: (index: number, changes: Partial<Education>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 && (
        <EmptyState title="Aún no tienes estudios">
          Con uno basta, y el título que estás terminando también cuenta.
        </EmptyState>
      )}

      {items.map((item, index) => (
        <EntryCard key={index} removeLabel="Quitar estudio" onRemove={() => onRemove(index)}>
          <EducationFields value={item} onChange={(changes) => onUpdate(index, changes)} />
        </EntryCard>
      ))}

      <AddButton label="Agregar estudio" onClick={onAdd} />
    </div>
  );
}

/** The fields of one job, shared by the wizard and the import review. */
export function ExperienceFields({
  value,
  onChange,
}: {
  value: Experience;
  onChange: (changes: Partial<Experience>) => void;
}) {
  return (
    <>
      <FieldGrid>
        <Field label="Empresa">
          <input
            className={inputClass}
            value={value.company}
            onChange={(e) => onChange({ company: e.target.value })}
            placeholder="Sofka Technologies"
          />
        </Field>
        <Field label="Cargo">
          <input
            className={inputClass}
            value={value.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Desarrollador frontend"
          />
        </Field>
        <Field label="Fecha de inicio">
          <input
            className={inputClass}
            type="month"
            value={value.startDate}
            onChange={(e) => onChange({ startDate: e.target.value })}
          />
        </Field>
        <Field label="Fecha de fin" hint="Déjala vacía si aún trabajas aquí.">
          <input
            className={inputClass}
            type="month"
            value={value.endDate ?? ""}
            onChange={(e) => onChange({ endDate: optionalText(e.target.value) })}
          />
        </Field>
      </FieldGrid>
      <Field label="Descripción">
        <textarea
          className={`${textareaClass} min-h-32 text-[15px]`}
          value={value.description ?? ""}
          onChange={(e) => onChange({ description: optionalText(e.target.value) })}
          placeholder="React y TypeScript en un portal bancario interno."
        />
      </Field>
    </>
  );
}

/** The fields of one degree, shared by the wizard and the import review. */
export function EducationFields({
  value,
  onChange,
}: {
  value: Education;
  onChange: (changes: Partial<Education>) => void;
}) {
  return (
    <>
      <FieldGrid>
        <Field label="Institución">
          <input
            className={inputClass}
            value={value.institution}
            onChange={(e) => onChange({ institution: e.target.value })}
            placeholder="Universidad EAFIT"
          />
        </Field>
        <Field label="Título">
          <input
            className={inputClass}
            value={value.degree}
            onChange={(e) => onChange({ degree: e.target.value })}
            placeholder="Ingeniería de Sistemas"
          />
        </Field>
        <Field label="Año de inicio">
          <input
            className={`${inputClass} tabular-nums`}
            type="number"
            min={1950}
            max={2100}
            value={value.startYear === 0 ? "" : value.startYear}
            onChange={(e) => onChange({ startYear: Number(e.target.value) || 0 })}
          />
        </Field>
        <Field label="Año de fin" hint="Déjalo vacío si aún no terminas.">
          <input
            className={`${inputClass} tabular-nums`}
            type="number"
            min={1950}
            max={2100}
            value={value.endYear ?? ""}
            onChange={(e) => onChange({ endYear: optionalNumber(e.target.value) })}
          />
        </Field>
      </FieldGrid>
    </>
  );
}
