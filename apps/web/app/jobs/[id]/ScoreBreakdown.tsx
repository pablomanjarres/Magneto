import type { CSSProperties } from "react";
import type { ScoreResult } from "@moonlight/types";
import { WEIGHTS } from "@moonlight/core";

import { Icon } from "../../../components/Icon";
import { EmptyState } from "../../../components/primitives";

/** Requirement, kind, weight, met — the four columns of the breakdown table. */
const COLUMNS = "minmax(0, 1fr) 128px 92px 96px";

const ROW: CSSProperties = { display: "grid", gridTemplateColumns: COLUMNS, padding: "13px 18px" };

const HEAD_ROW: CSSProperties = {
  ...ROW,
  padding: "11px 18px",
  borderBottom: "1px solid var(--line)",
  fontSize: 11,
  letterSpacing: "1.1px",
  textTransform: "uppercase",
  color: "var(--faint)",
};

const TOTAL_ROW: CSSProperties = { ...ROW, background: "var(--tint)", fontSize: 13 };

const RIGHT: CSSProperties = { textAlign: "right" };

/** The last two columns hold numbers, so they hug the right edge. */
const HEADINGS = ["Requirement", "Kind", "Weight", "You"];

/** The score line by line: what the vacancy asks for, and what you bring to it. */
export function ScoreBreakdown({
  result,
  earned,
  total,
}: {
  result: ScoreResult;
  earned: number;
  total: number;
}) {
  return (
    <section className="stack" style={{ gap: 14 }}>
      <div className="split">
        <h2 className="h2">Why you scored {result.score}%</h2>
        <span className="meta" style={RIGHT}>
          {result.reason}
        </span>
      </div>

      {result.breakdown.length === 0 ? (
        <EmptyState title="This vacancy lists no requirements">
          There is nothing to weigh your skills against, so the score stays at zero and the vacancy
          is kept out of the ranking rather than padded with a guess.
        </EmptyState>
      ) : (
        <>
          <div
            style={{
              border: "1px solid var(--line-strong)",
              borderRadius: "var(--radius)",
              background: "var(--panel)",
              overflow: "hidden",
            }}
          >
            <div style={HEAD_ROW}>
              {HEADINGS.map((heading, index) => (
                <span key={heading} style={index < 2 ? undefined : RIGHT}>
                  {heading}
                </span>
              ))}
            </div>

            {result.breakdown.map((line, index) => (
              <div
                key={line.skill}
                style={{
                  ...ROW,
                  alignItems: "center",
                  borderBottom:
                    index < result.breakdown.length - 1 ? "1px solid var(--line)" : "none",
                  background: line.met ? "transparent" : "var(--tint)",
                }}
              >
                <span style={{ fontSize: 14 }}>{line.skill}</span>
                <span className="meta" style={{ color: "var(--muted)" }}>
                  {line.kind}
                </span>
                <span
                  className="num"
                  style={{ ...RIGHT, fontSize: 13, color: "var(--ink-secondary)" }}
                >
                  {line.weight}
                </span>
                <span
                  className="meta"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 6,
                    color: line.met ? "var(--gold-text)" : "var(--dim)",
                  }}
                >
                  <Icon name={line.met ? "check" : "close"} size={14} strokeWidth={2.6} />
                  {line.met ? "have it" : "missing"}
                </span>
              </div>
            ))}

            <div style={TOTAL_ROW}>
              <span style={{ color: "var(--muted)" }}>Weight earned</span>
              <span />
              <span className="num" style={RIGHT}>
                {earned} / {total}
              </span>
              <span className="num" style={{ ...RIGHT, color: "var(--gold-text)" }}>
                {result.score}%
              </span>
            </div>
          </div>

          <p className="lead">
            Every requirement you meet adds its weight to yours. You earn{" "}
            <strong style={{ color: "var(--ink-secondary)" }}>{earned}</strong> of the{" "}
            <strong style={{ color: "var(--ink-secondary)" }}>{total}</strong> weight this vacancy
            puts on the table, and {earned} divided by {total} is {result.score}%.
          </p>

          <div className="card stack" style={{ gap: 5 }}>
            <span style={{ fontSize: 13.5 }}>How the score is built</span>
            <p className="lead">
              Every requirement carries a weight: a must-have is worth {WEIGHTS["must-have"]}, a
              nice-to-have is worth {WEIGHTS["nice-to-have"]}. Your score is the weight you earn
              divided by the weight on offer. No hidden factors and no ranking by company. Skill
              names are matched loosely, so <code>Node.js</code>, <code>node js</code> and{" "}
              <code>NodeJS</code> all count as one skill.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
