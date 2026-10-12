"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ApplicationCard, ApplicationStatus } from "@moonlight/types";
import { ALLOWED_MOVES, NOTE_MAX_LENGTH, STATUS_LABELS } from "@moonlight/core";

import { Field } from "../../components/primitives";
import { moveApplication, updateNextStep, withdrawApplication } from "../../lib/client";
import { placeMeta, salaryRange, shortDate } from "../../lib/format";

/** Withdrawing is destructive, so the button asks once. Reverts on its own. */
const CONFIRM_MS = 4000;

const noteStyle = (status: ApplicationStatus): React.CSSProperties =>
  status === "interview"
    ? {
        background: "var(--wash)",
        border: "1px solid var(--line-strong)",
        color: "var(--gold-deep)",
      }
    : {
        background: "var(--tint)",
        border: "1px solid var(--line)",
        color: "var(--muted)",
      };

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

  async function run(action: () => Promise<unknown>): Promise<void> {
    disarm();
    setPending(true);
    setError(null);
    try {
      await action();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "the request failed");
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
    await run(async () => {
      await updateNextStep(card.id, draft);
      setEditing(false);
    });
  }

  const moves = ALLOWED_MOVES[card.status];

  return (
    <article className="card stack" style={{ gap: 8, padding: 12 }}>
      <div className="split">
        <span
          className="num"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            lineHeight: 1,
            color: card.score >= 80 ? "var(--gold-deep)" : "var(--muted)",
          }}
        >
          {card.score}%
        </span>
        <span style={{ fontSize: 10.5, color: "var(--faint)", whiteSpace: "nowrap" }}>
          {shortDate(card.appliedAt)}
        </span>
      </div>

      <Link
        href={`/jobs/${card.vacancyId}`}
        style={{ fontSize: 13, lineHeight: 1.35, color: "var(--ink)", textWrap: "pretty" }}
      >
        {card.vacancy.title}
      </Link>

      <div className="stack" style={{ gap: 3 }}>
        <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{card.vacancy.company}</span>
        <span className="meta">
          {placeMeta(card.vacancy)} · {salaryRange(card.vacancy)}
        </span>
      </div>

      {card.note && !editing && (
        <span
          style={{
            fontSize: 11,
            padding: "5px 8px",
            borderRadius: 6,
            lineHeight: 1.4,
            textWrap: "pretty",
            ...noteStyle(card.status),
          }}
        >
          <strong>Next step:</strong> {card.note}
        </span>
      )}

      {editing && (
        <form className="stack" style={{ gap: 6 }} onSubmit={(e) => void onSaveNote(e)}>
          <Field label="Next step">
            <textarea
              className="textarea"
              value={draft}
              maxLength={NOTE_MAX_LENGTH}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
            />
          </Field>
          <div className="chips" style={{ gap: 6 }}>
            <button type="submit" className="btn btn--sm btn--primary" disabled={pending}>
              Save
            </button>
            <button
              type="button"
              className="btn btn--sm"
              disabled={pending}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && (
        <span role="alert" style={{ fontSize: 11, lineHeight: 1.4, color: "var(--gold-deep)" }}>
          {error}
        </span>
      )}

      <div className="chips" style={{ gap: 6, paddingTop: 2 }}>
        {moves.map((target) => (
          <button
            key={target}
            type="button"
            className="btn btn--sm"
            disabled={pending}
            aria-label={`Move to ${STATUS_LABELS[target]}`}
            onClick={() => void run(() => moveApplication(card.id, target))}
          >
            {STATUS_LABELS[target]}
          </button>
        ))}
        {!editing && (
          <button type="button" className="btn btn--sm" disabled={pending} onClick={startEditing}>
            Edit next step
          </button>
        )}
        <button
          type="button"
          className="btn btn--sm"
          disabled={pending}
          aria-label={armed ? "Confirm withdraw" : "Withdraw this application"}
          style={armed ? { borderColor: "var(--gold)", color: "var(--gold-deep)" } : undefined}
          onClick={onWithdraw}
          onBlur={disarm}
        >
          {armed ? "Sure?" : "Withdraw"}
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
