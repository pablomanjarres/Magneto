import type { MarketGap, Requirement, ScoreResult } from "@moonlight/types";
import { WEIGHTS, normalizeSkill } from "@moonlight/core";

import { Chip, EmptyState, ProgressBar } from "../../../components/primitives";

/** Must-haves first: they are the ones that move the score most. */
const byImpact = (a: Requirement, b: Requirement): number =>
  WEIGHTS[b.kind] - WEIGHTS[a.kind] || a.skill.localeCompare(b.skill);

/** How many gaps get a before-and-after row of their own; the rest stay chips. */
const DETAILED = 3;

/** What the candidate is missing, and what closing each gap is worth. */
export function CloseTheGap({
  result,
  earned,
  total,
  gaps,
  vacancyCount,
}: {
  result: ScoreResult;
  earned: number;
  total: number;
  gaps: MarketGap[];
  vacancyCount: number;
}) {
  if (result.breakdown.length === 0) {
    return (
      <EmptyState title="Nothing to close">
        This vacancy asks for no skills, so there is no gap to work on.
      </EmptyState>
    );
  }

  const missing = [...result.missing].sort(byImpact);
  if (missing.length === 0) {
    return (
      <div className="card stack" style={{ gap: 6 }}>
        <span style={{ fontSize: 15 }}>A full match</span>
        <p className="lead">
          You meet all {result.breakdown.length} requirements, must-haves included. There is nothing
          left to learn for this one — apply.
        </p>
      </div>
    );
  }

  const gapBySkill = new Map(gaps.map((gap) => [normalizeSkill(gap.skill), gap]));
  const rest = missing.length - DETAILED;

  return (
    <div className="card stack" style={{ gap: 14 }}>
      <div className="stack" style={{ gap: 8 }}>
        <div className="chips">
          {missing.map((requirement) => (
            <Chip key={requirement.skill} tone="missing">
              {requirement.skill}
            </Chip>
          ))}
        </div>
        <p className="lead">
          {missing.some((r) => r.kind === "must-have")
            ? "Must-haves are listed first: each one is worth three times a nice-to-have, so they move the score most."
            : "Only nice-to-haves are missing, so every must-have this vacancy asks for is already on your profile."}
        </p>
      </div>

      {missing.slice(0, DETAILED).map((requirement) => {
        const weight = WEIGHTS[requirement.kind];
        const potential = total === 0 ? 0 : Math.round(((earned + weight) / total) * 100);
        const gap = gapBySkill.get(normalizeSkill(requirement.skill));
        const others = gap ? gap.demandCount - 1 : 0;

        return (
          <div
            key={requirement.skill}
            className="stack"
            style={{ gap: 10, paddingTop: 14, borderTop: "1px solid var(--line)" }}
          >
            <div className="split">
              <span style={{ fontSize: 16 }}>{requirement.skill}</span>
              <span className="meta num" style={{ color: "var(--muted)" }}>
                {requirement.kind} · weight {weight}
              </span>
            </div>

            <div className="row" style={{ gap: 11 }}>
              <span className="num" style={{ fontSize: 15, color: "var(--muted)" }}>
                {result.score}%
              </span>
              <div className="grow">
                <ProgressBar percentage={potential} />
              </div>
              <span className="num" style={{ fontSize: 15, color: "var(--gold)" }}>
                {potential}%
              </span>
            </div>

            <p className="lead">
              {gap
                ? `Asked for by ${gap.demandCount} of the ${vacancyCount} open vacancies` +
                  (others > 0
                    ? `, so learning it also lifts your score on ${others} other${others === 1 ? "" : "s"}.`
                    : ", and this is the only one asking for it.")
                : `Learning it takes this match to ${potential}%.`}
            </p>
          </div>
        );
      })}

      {rest > 0 && (
        <span className="meta">
          {rest} more missing requirement{rest === 1 ? " is" : "s are"} listed above.
        </span>
      )}
    </div>
  );
}
