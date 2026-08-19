import type { ReactNode } from "react";

import { Icon } from "./Icon";

/** The small pieces every screen repeats. One definition each, no copies. */

/** `label` names the bar: a progressbar without one is announced as a bare number. */
export function ProgressBar({ percentage, label }: { percentage: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, percentage));
  return (
    <div
      className="track"
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="track__fill" style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function Score({ score, large = false }: { score: number; large?: boolean }) {
  return (
    <div className={large ? "score score--lg" : "score"}>
      <span className="score__num num">{score}</span>
      <span className="score__label">MATCH</span>
    </div>
  );
}

export function Chip({
  children,
  tone = "plain",
}: {
  children: ReactNode;
  tone?: "plain" | "dashed" | "met" | "missing";
}) {
  const className = tone === "plain" ? "chip" : `chip chip--${tone}`;
  return (
    <span className={className}>
      {tone === "met" && <Icon name="check" size={11} strokeWidth={2.6} />}
      {tone === "missing" && <Icon name="close" size={11} strokeWidth={2.6} />}
      {tone === "dashed" && <span className="chip__dot" />}
      {children}
    </span>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <p style={{ margin: 0, color: "var(--ink-secondary)" }}>{title}</p>
      {children && (
        <p className="lead" style={{ marginTop: 8 }}>
          {children}
        </p>
      )}
    </div>
  );
}

/**
 * One labelled input. Pass `group` when the label covers several controls
 * rather than one — a `<label>` around a row of buttons points at nothing, so
 * that case gets a real group with an accessible name instead.
 */
export function Field({
  label,
  hint,
  group = false,
  children,
}: {
  label: string;
  hint?: string;
  group?: boolean;
  children: ReactNode;
}) {
  const body = (
    <>
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </>
  );

  return group ? (
    <div className="field" role="group" aria-label={label}>
      {body}
    </div>
  ) : (
    <label className="field">{body}</label>
  );
}
