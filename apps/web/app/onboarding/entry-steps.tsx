"use client";

import type { Education, Experience } from "@moonlight/types";

import { EmptyState, Field, inputClass } from "../../components/primitives";
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
          <FieldGrid>
            <Field label="Empresa">
              <input
                className={inputClass}
                value={item.company}
                onChange={(e) => onUpdate(index, { company: e.target.value })}
                placeholder="Sofka Technologies"
              />
            </Field>
            <Field label="Cargo">
              <input
                className={inputClass}
                value={item.title}
                onChange={(e) => onUpdate(index, { title: e.target.value })}
                placeholder="Desarrollador frontend"
              />
            </Field>
            <Field label="Fecha de inicio">
              <input
                className={inputClass}
                type="month"
                value={item.startDate}
                onChange={(e) => onUpdate(index, { startDate: e.target.value })}
              />
            </Field>
            <Field label="Fecha de fin" hint="Déjala vacía si aún trabajas aquí.">
              <input
                className={inputClass}
                type="month"
                value={item.endDate ?? ""}
                onChange={(e) => onUpdate(index, { endDate: optionalText(e.target.value) })}
              />
            </Field>
          </FieldGrid>
          <Field label="Descripción">
            <textarea
              className={`${inputClass} h-auto min-h-24 rounded-3xl py-3`}
              value={item.description ?? ""}
              onChange={(e) => onUpdate(index, { description: optionalText(e.target.value) })}
              placeholder="React y TypeScript en un portal bancario interno."
            />
          </Field>
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
          <FieldGrid>
            <Field label="Institución">
              <input
                className={inputClass}
                value={item.institution}
                onChange={(e) => onUpdate(index, { institution: e.target.value })}
                placeholder="Universidad EAFIT"
              />
            </Field>
            <Field label="Título">
              <input
                className={inputClass}
                value={item.degree}
                onChange={(e) => onUpdate(index, { degree: e.target.value })}
                placeholder="Ingeniería de Sistemas"
              />
            </Field>
            <Field label="Año de inicio">
              <input
                className={`${inputClass} tabular-nums`}
                type="number"
                min={1950}
                max={2100}
                value={item.startYear === 0 ? "" : item.startYear}
                onChange={(e) => onUpdate(index, { startYear: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Año de fin" hint="Déjalo vacío si aún no terminas.">
              <input
                className={`${inputClass} tabular-nums`}
                type="number"
                min={1950}
                max={2100}
                value={item.endYear ?? ""}
                onChange={(e) => onUpdate(index, { endYear: optionalNumber(e.target.value) })}
              />
            </Field>
          </FieldGrid>
        </EntryCard>
      ))}

      <AddButton label="Agregar estudio" onClick={onAdd} />
    </div>
  );
}
