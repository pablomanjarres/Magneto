import type { ApplicationCard, ApplicationStatus } from "@moonlight/types";

import { BoardCard } from "./BoardCard";

/** Each column's dot and what it says while empty. */
const COLUMN: Record<ApplicationStatus, { dot: string; empty: string }> = {
  applied: { dot: "bg-navy", empty: "Aún no te postulas. Las vacantes evaluadas te esperan." },
  "in-review": { dot: "bg-brand", empty: "Nada en revisión por ahora." },
  interview: { dot: "bg-mint-deep", empty: "Sin entrevistas todavía. Mueve las mejores." },
  rejected: { dot: "bg-muted", empty: "Nada descartado. Bien." },
};

export function BoardColumn({
  status,
  label,
  cards,
}: {
  status: ApplicationStatus;
  label: string;
  cards: ApplicationCard[];
}) {
  const { dot, empty } = COLUMN[status];

  return (
    <section className="flex snap-start flex-col gap-3 rounded-3xl bg-surface p-3">
      <header className="flex items-center justify-between px-2 pt-1">
        <span className="flex items-center gap-2 text-sm font-black text-slate">
          <span className={`size-2.5 rounded-full ${dot}`} aria-hidden />
          {label}
        </span>
        <span className="rounded-full bg-canvas px-2.5 py-0.5 text-xs font-bold text-muted tabular-nums">
          {cards.length}
        </span>
      </header>

      {cards.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-control/60 px-4 py-6 text-center text-sm text-pretty text-muted">
          {empty}
        </p>
      ) : (
        cards.map((card) => <BoardCard key={card.id} card={card} />)
      )}
    </section>
  );
}
