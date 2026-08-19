import type { ApplicationCard, ApplicationStatus } from "@moonlight/types";

import { BoardCard } from "./BoardCard";

/** The pipeline reads left to right, so the dot darkens with it. */
const DOT_OPACITY: Record<ApplicationStatus, number> = {
  applied: 0.35,
  "in-review": 0.6,
  interview: 0.9,
  rejected: 0.16,
};

/** An empty column still says what belongs in it. */
const EMPTY_TEXT: Record<ApplicationStatus, string> = {
  applied: "Nothing applied yet. The scored list is at Vacancies.",
  "in-review": "Nothing being read right now.",
  interview: "No interviews yet. Keep the top of the list moving.",
  rejected: "No rejections here.",
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
  return (
    <section className="stack" style={{ gap: 0 }}>
      <div className="column__head">
        <span className="row" style={{ gap: 8 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: "var(--glow)",
              opacity: DOT_OPACITY[status],
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12.5, color: "var(--ink-secondary)" }}>{label}</span>
        </span>
        <span className="meta num">{cards.length}</span>
      </div>

      <div className="column__cards">
        {cards.length === 0 ? (
          <p
            className="meta"
            style={{
              margin: 0,
              padding: "22px 12px",
              border: "1px dashed var(--line-dashed)",
              borderRadius: 10,
              textAlign: "center",
              textWrap: "pretty",
              lineHeight: 1.45,
            }}
          >
            {EMPTY_TEXT[status]}
          </p>
        ) : (
          cards.map((card) => <BoardCard key={card.id} card={card} />)
        )}
      </div>
    </section>
  );
}
