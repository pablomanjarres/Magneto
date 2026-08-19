"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ApplicationCard, ApplicationStatus } from "@moonlight/types";
import { ALLOWED_MOVES, STATUS_LABELS } from "@moonlight/core";

import { moveApplication, withdrawApplication } from "../../lib/client";
import { salaryRange, shortDate, workModeLabel } from "../../lib/format";

/** Withdrawing is destructive, so the button asks once. Reverts on its own. */
const CONFIRM_MS = 4000;

const noteStyle = (status: ApplicationStatus): React.CSSProperties =>
  status === "interview"
    ? {
        background: "var(--wash)",
        border: "1px solid var(--line-strong)",
        color: "var(--gold)",
      }
    : {
        background: "rgba(15, 26, 44, 0.04)",
        border: "1px solid var(--line)",
        color: "var(--muted)",
      };

export function BoardCard({ card }: { card: ApplicationCard }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
            color: card.score >= 80 ? "var(--gold)" : "var(--muted)",
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
          {card.vacancy.city} · {workModeLabel(card.vacancy.workMode)} · {salaryRange(card.vacancy)}
        </span>
      </div>

      {card.note && (
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
          {card.note}
        </span>
      )}

      {error && (
        <span role="alert" style={{ fontSize: 11, lineHeight: 1.4, color: "var(--gold)" }}>
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
        <button
          type="button"
          className="btn btn--sm"
          disabled={pending}
          aria-label={armed ? "Confirm withdraw" : "Withdraw this application"}
          style={armed ? { borderColor: "var(--gold)", color: "var(--gold)" } : undefined}
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
