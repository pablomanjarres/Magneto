"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import type { CompletenessResult } from "@moonlight/types";
import { COMPLETENESS_FIELDS } from "@moonlight/core";

import { Icon } from "../../components/Icon";
import { ProgressBar } from "../../components/primitives";

/** Two fields to a row. globals.css has no grid helper, so it lives here once. */
export const PAIRED_FIELDS: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px 18px",
};

/** An input left empty is a missing value, not an empty string. */
export function optionalText(value: string): string | undefined {
  return value === "" ? undefined : value;
}

export function optionalNumber(value: string): number | undefined {
  return value === "" ? undefined : Number(value);
}

/** The whole point of the wizard, on screen at every step. */
export function CompletenessRail({ completeness }: { completeness: CompletenessResult }) {
  const filled = COMPLETENESS_FIELDS.length - completeness.missing.length;

  return (
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
          A finished profile is scored against every open vacancy. Each empty field is a match we
          cannot compute for you.
        </span>
      </div>
    </aside>
  );
}

/**
 * One box of removable chips fed by a text input. Skills and relocation cities
 * are the same interaction, so they are the same component. The half-typed word
 * is the only state that stays here; the list itself lives in the wizard.
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
      <span style={{ color: "var(--gold)", display: "flex" }}>
        <Icon name="plus" size={16} strokeWidth={2.2} />
      </span>
      {label}
    </button>
  );
}
