"use client";

import { useState, type ReactNode } from "react";
import type { CompletenessResult, Profile } from "@moonlight/types";

import { CompletenessPanel } from "../../components/CompletenessPanel";
import { Icon } from "../../components/Icon";
import { Card, Eyebrow, buttonClass, inputClass } from "../../components/primitives";
import { Laptop } from "../../components/toys/Laptop";
import type { Typing } from "./typing";

/** An input left empty is a missing value, not an empty string. */
export function optionalText(value: string): string | undefined {
  return value === "" ? undefined : value;
}

export function optionalNumber(value: string): number | undefined {
  return value === "" ? undefined : Number(value);
}

/**
 * The laptop that types the profile as the candidate writes it: focusing any
 * field opens it, and clicking it jumps to the step's first field.
 */
export function LaptopPanel({
  typing,
  profile,
  completeness,
  onActivate,
}: {
  typing: Typing;
  profile: Profile;
  completeness: number;
  onActivate: () => void;
}) {
  return (
    <div className="h-64 animate-rise overflow-hidden rounded-3xl bg-navy [animation-delay:120ms] sm:h-96 lg:h-72">
      <Laptop
        profile={profile}
        completeness={completeness}
        text={typing.text}
        writing={typing.writing}
        keystrokes={typing.keystrokes}
        prompt={typing.prompt}
        onActivate={onActivate}
        caption={typing.writing ? undefined : "Haz clic en el portátil o escribe en un campo"}
      />
    </div>
  );
}

/**
 * The whole point of the wizard, on screen at every step. It is fed the draft's
 * completeness, so the figure moves while the candidate types, not after saving.
 */
export function CompletenessRail({ completeness }: { completeness: CompletenessResult }) {
  return (
    <Card className="flex animate-rise flex-col gap-5 p-6 [animation-delay:150ms]">
      <div>
        <Eyebrow>Completitud del perfil</Eyebrow>
        <p className="mt-1 text-5xl font-black text-navy tabular-nums" aria-live="polite">
          {completeness.percentage}
          <span className="text-2xl">%</span>
        </p>
      </div>

      <CompletenessPanel completeness={completeness} figure={false} />

      <p className="rounded-2xl bg-brand-wash p-4 text-sm text-ink">
        Tu match lee tus habilidades, tu ciudad y si te reubicas. Lo demás lo ve el reclutador
        en tu hoja de vida.
      </p>
    </Card>
  );
}

/**
 * Removable chips fed by a text input. Skills and relocation cities are the
 * same interaction, so they are the same component. The half-typed word is the
 * only state that stays here; the list itself lives in the wizard.
 */
export function ChipInput({
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
    <div className="flex flex-col gap-3" role="group" aria-label={label}>
      <span className="text-sm font-bold text-ink">{label}</span>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="inline-flex animate-pop items-center gap-1 rounded-full bg-brand-wash py-1 pr-1 pl-3 text-[13px] font-bold text-brand"
            >
              {value}
              <button
                type="button"
                aria-label={`Quitar ${value}`}
                onClick={() => onChange(values.filter((held) => held !== value))}
                className="flex size-6 items-center justify-center rounded-full transition hover:bg-brand hover:text-white"
              >
                <Icon name="close" size={12} strokeWidth={2.6} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className={inputClass}
          aria-label={label}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          // Leaving the box is as much a commit as pressing Enter: whatever was
          // typed is kept instead of being dropped by the next step.
          onBlur={add}
          placeholder={placeholder}
        />
        <button
          type="button"
          className={buttonClass("strong")}
          onClick={add}
          disabled={draft.trim() === ""}
        >
          <Icon name="plus" size={16} strokeWidth={2.4} />
          Agregar
        </button>
      </div>
    </div>
  );
}

/** A repeatable block: the fields and the one way out. */
export function EntryCard({
  removeLabel,
  onRemove,
  children,
}: {
  removeLabel: string;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex animate-rise flex-col gap-4 rounded-3xl border border-line bg-surface/40 p-5">
      {children}
      <button
        type="button"
        className={`${buttonClass("danger", "sm")} self-end`}
        onClick={onRemove}
      >
        <Icon name="trash" size={14} />
        {removeLabel}
      </button>
    </div>
  );
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${buttonClass("ghost")} w-full border border-dashed border-control`}
    >
      <Icon name="plus" size={16} strokeWidth={2.4} />
      {label}
    </button>
  );
}

/** Pairs of fields side by side on wide screens, stacked on phones. */
export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}
