"use client";

import { useState, type ReactNode } from "react";
import type { ProfileSource } from "@moonlight/types";

import { Icon } from "../../components/Icon";
import { SourceChip } from "../../components/SourceChip";
import { buttonClass } from "../../components/primitives";

/**
 * One imported job or degree: keep it or not, see where it came from, and fix
 * it inline. Required fields still missing are named on the card itself.
 */
export function ReviewCard({
  title,
  subtitle,
  period,
  source,
  selected,
  joins,
  missing,
  delay,
  onToggle,
  fields,
}: {
  title: string;
  subtitle: string;
  period: string;
  source: ProfileSource;
  selected: boolean;
  /** It matches an entry already in the profile, which it completes instead of repeating. */
  joins: boolean;
  missing: string[];
  delay: number;
  onToggle: (selected: boolean) => void;
  fields: ReactNode;
}) {
  const incomplete = selected && missing.length > 0;
  // An entry the import could not complete opens ready to be fixed.
  const [editing, setEditing] = useState(incomplete);

  return (
    <li
      className={`flex animate-pop flex-col gap-4 rounded-3xl border p-5 transition ${
        incomplete
          ? "border-danger/40 bg-danger-wash/30"
          : selected
            ? "border-brand/40 bg-canvas"
            : "border-line bg-surface/50"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 size-5 shrink-0 cursor-pointer accent-brand"
          checked={selected}
          onChange={(e) => onToggle(e.target.checked)}
          aria-label={`Importar ${title || "esta entrada"}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-bold ${selected ? "text-slate" : "text-muted"}`}>
              {title || "Sin título"}
            </span>
            <SourceChip source={source} />
          </div>
          <p className="text-sm text-muted">{subtitle || "Sin dato"}</p>
          <p className="text-xs font-bold text-muted tabular-nums">{period}</p>
          {joins && (
            <p className="mt-1 text-xs font-bold text-mint-deep">
              Ya está en tu perfil: se completa, no se repite
            </p>
          )}
          {incomplete && (
            <p className="mt-1 text-xs font-bold text-danger">Falta: {missing.join(", ")}</p>
          )}
        </div>
        <button
          type="button"
          className={buttonClass("ghost", "sm")}
          aria-expanded={editing}
          onClick={() => setEditing(!editing)}
        >
          <Icon name={editing ? "check" : "edit"} size={14} />
          {editing ? "Listo" : "Editar"}
        </button>
      </div>
      {editing && <div className="flex animate-rise flex-col gap-4">{fields}</div>}
    </li>
  );
}
