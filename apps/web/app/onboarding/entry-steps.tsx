"use client";

import type { Education, Experience } from "@moonlight/types";

import { EmptyState, Field } from "../../components/primitives";
import { AddButton, EntryCard, optionalNumber, optionalText } from "./fields";

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
    <div className="stack" style={{ gap: 12 }}>
      {items.length === 0 && (
        <EmptyState title="No positions yet">
          Add the one you are in now. An unfinished job is still a position — leave the end date
          empty.
        </EmptyState>
      )}

      {items.map((item, index) => (
        <EntryCard key={index} removeLabel="Remove this position" onRemove={() => onRemove(index)}>
          <div className="two-fields">
            <Field label="Company">
              <input
                className="input"
                value={item.company}
                onChange={(e) => onUpdate(index, { company: e.target.value })}
                placeholder="Sofka Technologies"
              />
            </Field>
            <Field label="Title">
              <input
                className="input"
                value={item.title}
                onChange={(e) => onUpdate(index, { title: e.target.value })}
                placeholder="Frontend Developer"
              />
            </Field>
            <Field label="Start date">
              <input
                className="input"
                type="month"
                value={item.startDate}
                onChange={(e) => onUpdate(index, { startDate: e.target.value })}
              />
            </Field>
            <Field label="End date" hint="Leave empty if you still work here.">
              <input
                className="input"
                type="month"
                value={item.endDate ?? ""}
                onChange={(e) => onUpdate(index, { endDate: optionalText(e.target.value) })}
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              className="textarea"
              value={item.description ?? ""}
              onChange={(e) => onUpdate(index, { description: optionalText(e.target.value) })}
              placeholder="React and TypeScript on an internal banking portal."
            />
          </Field>
        </EntryCard>
      ))}

      <AddButton label="Add a position" onClick={onAdd} />
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
    <div className="stack" style={{ gap: 12 }}>
      {items.length === 0 && (
        <EmptyState title="No studies yet">
          One entry is enough, and the degree you are still finishing counts.
        </EmptyState>
      )}

      {items.map((item, index) => (
        <EntryCard key={index} removeLabel="Remove this degree" onRemove={() => onRemove(index)}>
          <div className="two-fields">
            <Field label="Institution">
              <input
                className="input"
                value={item.institution}
                onChange={(e) => onUpdate(index, { institution: e.target.value })}
                placeholder="Universidad EAFIT"
              />
            </Field>
            <Field label="Degree">
              <input
                className="input"
                value={item.degree}
                onChange={(e) => onUpdate(index, { degree: e.target.value })}
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
                onChange={(e) => onUpdate(index, { startYear: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="End year" hint="Leave empty if you have not finished.">
              <input
                className="input num"
                type="number"
                min={1950}
                max={2100}
                value={item.endYear ?? ""}
                onChange={(e) => onUpdate(index, { endYear: optionalNumber(e.target.value) })}
              />
            </Field>
          </div>
        </EntryCard>
      ))}

      <AddButton label="Add a degree" onClick={onAdd} />
    </div>
  );
}
