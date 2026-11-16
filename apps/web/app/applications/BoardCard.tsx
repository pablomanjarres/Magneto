"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ApplicationCard } from "@moonlight/types";
import { ALLOWED_MOVES, NOTE_MAX_LENGTH, STATUS_LABELS } from "@moonlight/core";

import { Icon } from "../../components/Icon";
import { Field, buttonClass, liftCard, textareaClass } from "../../components/primitives";
import { moveApplication, updateNextStep, withdrawApplication } from "../../lib/client";
import { shortDate } from "../../lib/format";

/** Withdrawing is destructive, so the button asks once. Reverts on its own. */
const CONFIRM_MS = 4000;

export function BoardCard({ card }: { card: ApplicationCard }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => clearTimer(timer), []);

  function disarm(): void {
    clearTimer(timer);
    setArmed(false);
  }

  /** True only when the API answered OK; the server data is then re-read. */
  async function run(action: () => Promise<unknown>): Promise<boolean> {
    disarm();
    setPending(true);
    setError(null);
    try {
      await action();
      router.refresh();
      return true;
    } catch (cause) {
      console.error(cause);
      setError("No se pudo completar. Intenta de nuevo.");
      return false;
    } finally {
      setPending(false);
    }
  }

  function onWithdraw(): void {
    if (armed) {
      void run(() => withdrawApplication(card.id));
      return;
    }
    setArmed(true);
    clearTimer(timer);
    timer.current = setTimeout(() => setArmed(false), CONFIRM_MS);
  }

  function startEditing(): void {
    setDraft(card.note ?? "");
    setEditing(true);
  }

  async function onSaveNote(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    // Close the form only when the save worked, so a refused note can be fixed in place.
    if (await run(() => updateNextStep(card.id, draft))) setEditing(false);
  }

  return (
    <article
      aria-busy={pending}
      className={`flex animate-pop flex-col gap-3 rounded-3xl border border-line bg-canvas p-4 ${liftCard}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/jobs/${card.vacancyId}`}
            className="font-bold text-pretty text-ink hover:text-brand"
          >
            {card.vacancy.title}
          </Link>
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted">
            <Icon name="building" size={13} />
            {card.vacancy.company}
          </p>
        </div>
        <span
          className="text-2xl leading-none font-black text-navy tabular-nums"
          aria-label={`${card.score}% de coincidencia`}
        >
          {card.score}
          <span className="text-sm">%</span>
        </span>
      </div>

      <p className="text-xs text-muted">Postulado el {shortDate(card.appliedAt)}</p>

      {card.note && !editing && (
        <p
          className={`rounded-2xl px-3 py-2 text-[13px] text-pretty ${
            card.status === "interview" ? "bg-mint-wash text-mint-deep" : "bg-surface text-ink"
          }`}
        >
          <strong>Próximo paso:</strong> {card.note}
        </p>
      )}

      {editing && (
        <form className="flex flex-col gap-2" onSubmit={(e) => void onSaveNote(e)}>
          <Field label="Próximo paso">
            <textarea
              className={`${textareaClass} min-h-20 text-sm`}
              value={draft}
              maxLength={NOTE_MAX_LENGTH}
              placeholder="Ej.: Enviar portafolio el viernes"
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
            />
          </Field>
          <div className="flex gap-2">
            <button type="submit" className={buttonClass("strong", "sm")} disabled={pending}>
              {pending ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              className={buttonClass("quiet", "sm")}
              disabled={pending}
              onClick={() => setEditing(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {error && (
        <p role="alert" className="rounded-2xl bg-danger-wash px-3 py-2 text-[13px] text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 border-t border-line pt-3">
        {ALLOWED_MOVES[card.status].map((target) => (
          <button
            key={target}
            type="button"
            className={buttonClass("quiet", "sm")}
            disabled={pending}
            aria-label={`Mover a ${STATUS_LABELS[target]}`}
            onClick={() => void run(() => moveApplication(card.id, target))}
          >
            <Icon name="arrowRight" size={13} strokeWidth={2.4} />
            {STATUS_LABELS[target]}
          </button>
        ))}
        {!editing && (
          <button
            type="button"
            className={buttonClass("ghost", "sm")}
            disabled={pending}
            onClick={startEditing}
          >
            <Icon name="edit" size={13} />
            Editar próximo paso
          </button>
        )}
        <button
          type="button"
          className={`${buttonClass("danger", "sm")} ${armed ? "bg-danger-wash" : ""}`}
          disabled={pending}
          aria-label={armed ? "Confirmar retiro" : "Retirar esta postulación"}
          onClick={onWithdraw}
          onBlur={disarm}
        >
          <Icon name="trash" size={13} />
          {armed ? "¿Seguro?" : "Retirar"}
        </button>
      </div>
    </article>
  );
}

function clearTimer(ref: { current: ReturnType<typeof setTimeout> | null }): void {
  if (ref.current !== null) {
    clearTimeout(ref.current);
    ref.current = null;
  }
}
