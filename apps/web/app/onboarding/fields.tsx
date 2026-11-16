"use client";

import { useState, type ReactNode } from "react";
import type { CompletenessResult } from "@moonlight/types";

import { CompletenessPanel } from "../../components/CompletenessPanel";
import { Icon } from "../../components/Icon";
import { MoonHero } from "../../components/moon/MoonHero";
import { Card, Eyebrow, buttonClass, inputClass } from "../../components/primitives";

/** An input left empty is a missing value, not an empty string. */
export function optionalText(value: string): string | undefined {
  return value === "" ? undefined : value;
}

export function optionalNumber(value: string): number | undefined {
  return value === "" ? undefined : Number(value);
}

/**
 * The whole point of the wizard, on screen at every step. It is fed the draft's
 * completeness, so the moon fills while the candidate types, not after saving.
 */
export function CompletenessRail({ completeness }: { completeness: CompletenessResult }) {
  return (
    <Card className="flex animate-rise flex-col gap-5 p-6 [animation-delay:150ms] lg:sticky lg:top-24">
      <div className="relative h-64 overflow-hidden rounded-3xl bg-navy">
        <MoonHero percentage={completeness.percentage} />
      </div>

      <div>
        <Eyebrow>Completitud del perfil</Eyebrow>
        <p className="mt-1 text-5xl font-black text-navy tabular-nums" aria-live="polite">
          {completeness.percentage}
          <span className="text-2xl">%</span>
        </p>
      </div>

      <CompletenessPanel completeness={completeness} />

      <p className="rounded-2xl bg-brand-wash p-4 text-sm text-ink">
        Un perfil completo se evalúa contra cada vacante abierta. Cada campo vacío es una
        coincidencia que no podemos calcular.
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

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
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
      <span style={{ color: "var(--gold-deep)", display: "flex" }}>
        <Icon name="plus" size={16} strokeWidth={2.2} />
      </span>
      {label}
    </button>
  );
}
