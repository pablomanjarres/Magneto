import Link from "next/link";
import { notFound } from "next/navigation";
import type { Requirement } from "@moonlight/types";
import { getVacancy, listApplications } from "@moonlight/db";
import { STATUS_LABELS, WEIGHTS, normalizeSkill, scoreVacancy } from "@moonlight/core";

import { AppShell } from "../../../components/AppShell";
import { Icon } from "../../../components/Icon";
import { Chip, EmptyState, ProgressBar, Score } from "../../../components/primitives";
import { salaryRange, shortDate, workModeLabel } from "../../../lib/format";
import { loadProfile, loadRanked } from "../../../lib/queries";
import { ApplyButton } from "./ApplyButton";

export const dynamic = "force-dynamic";

/** Requirement, kind, weight, met — the four columns of the breakdown table. */
const COLUMNS = "minmax(0, 1fr) 128px 92px 96px";

/** Must-haves first: they are the ones that move the score most. */
const byImpact = (a: Requirement, b: Requirement): number =>
  WEIGHTS[b.kind] - WEIGHTS[a.kind] || a.skill.localeCompare(b.skill);

export default async function VacancyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, vacancy] = await Promise.all([loadProfile(), getVacancy(id)]);
  if (!vacancy) notFound();

  if (!profile) {
    return (
      <AppShell title="Vacancy">
        <EmptyState title="No candidate yet">
          A score needs a profile. Fill the wizard at <Link href="/onboarding">/onboarding</Link>, or
          seed the demo candidate with <code>pnpm db:seed</code>.
        </EmptyState>
      </AppShell>
    );
  }

  const result = scoreVacancy(profile, vacancy);
  const [{ vacancies, ranked, gaps }, applications] = await Promise.all([
    loadRanked(profile),
    listApplications(profile.id),
  ]);

  const application = applications.find((a) => a.vacancyId === vacancy.id);
  const rank = ranked.findIndex((r) => r.vacancyId === vacancy.id) + 1;
  const total = result.breakdown.reduce((sum, line) => sum + line.weight, 0);
  const earned = result.breakdown.reduce((sum, line) => sum + (line.met ? line.weight : 0), 0);
  const missing = [...result.missing].sort(byImpact);
  const gapBySkill = new Map(gaps.map((gap) => [normalizeSkill(gap.skill), gap]));
  const priced = vacancy.salaryMin !== undefined || vacancy.salaryMax !== undefined;

  return (
    <AppShell
      title={vacancy.title}
      meta={rank > 0 ? `Ranked #${rank} of ${ranked.length} for ${profile.fullName}` : "Not ranked"}
    >
      <Link href="/jobs" className="row" style={{ gap: 8, width: "fit-content", fontSize: 12.5 }}>
        <Icon name="arrowLeft" size={16} />
        All vacancies
      </Link>

      <section
        className="panel"
        style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 28, alignItems: "center" }}
      >
        <div className="stack" style={{ gap: 12 }}>
          <h1 className="display" style={{ fontSize: 38 }}>
            {vacancy.title}
          </h1>
          <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, color: "var(--ink-secondary)" }}>{vacancy.company}</span>
            <span className="meta" style={{ color: "var(--muted)" }}>
              {vacancy.city}
            </span>
            <span className="meta" style={{ color: "var(--muted)" }}>
              {workModeLabel(vacancy.workMode)}
            </span>
            <span className="meta num" style={{ color: "var(--muted)" }}>
              {salaryRange(vacancy)}
              {priced && " / month"}
            </span>
          </div>
        </div>

        <div
          className="stack"
          style={{
            alignItems: "center",
            gap: 8,
            maxWidth: 190,
            paddingLeft: 28,
            borderLeft: "1px solid var(--line)",
          }}
        >
          <Score score={result.score} large />
          <span className="meta" style={{ textAlign: "center", textWrap: "pretty" }}>
            {rank > 0
              ? `Match number ${rank} out of the ${ranked.length} scored vacancies.`
              : "Left out of the ranking: this vacancy lists no requirements."}
          </span>
        </div>
      </section>

      <div className="two-col">
        <section className="stack" style={{ gap: 14 }}>
          <div className="split">
            <h2 className="h2">Why you scored {result.score}%</h2>
            <span className="meta" style={{ textAlign: "right" }}>
              {result.reason}
            </span>
          </div>

          {result.breakdown.length === 0 ? (
            <EmptyState title="This vacancy lists no requirements">
              There is nothing to weigh your skills against, so the score stays at zero and the
              vacancy is kept out of the ranking rather than padded with a guess.
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
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: COLUMNS,
                    padding: "11px 18px",
                    borderBottom: "1px solid var(--line)",
                    fontSize: 11,
                    letterSpacing: "1.1px",
                    textTransform: "uppercase",
                    color: "var(--faint)",
                  }}
                >
                  <span>Requirement</span>
                  <span>Kind</span>
                  <span style={{ textAlign: "right" }}>Weight</span>
                  <span style={{ textAlign: "right" }}>You</span>
                </div>

                {result.breakdown.map((line, index) => (
                  <div
                    key={line.skill}
                    style={{
                      display: "grid",
                      gridTemplateColumns: COLUMNS,
                      alignItems: "center",
                      padding: "13px 18px",
                      borderBottom:
                        index < result.breakdown.length - 1 ? "1px solid var(--line)" : "none",
                      background: line.met ? "transparent" : "rgba(15, 26, 44, 0.045)",
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{line.skill}</span>
                    <span className="meta" style={{ color: "var(--muted)" }}>
                      {line.kind}
                    </span>
                    <span
                      className="num"
                      style={{ textAlign: "right", fontSize: 13, color: "var(--ink-secondary)" }}
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
                        color: line.met ? "var(--gold)" : "var(--dim)",
                      }}
                    >
                      <Icon name={line.met ? "check" : "close"} size={14} strokeWidth={2.6} />
                      {line.met ? "have it" : "missing"}
                    </span>
                  </div>
                ))}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: COLUMNS,
                    padding: "13px 18px",
                    background: "rgba(15, 26, 44, 0.06)",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "var(--muted)" }}>Weight earned</span>
                  <span />
                  <span className="num" style={{ textAlign: "right" }}>
                    {earned} / {total}
                  </span>
                  <span className="num" style={{ textAlign: "right", color: "var(--gold)" }}>
                    {result.score}%
                  </span>
                </div>
              </div>

              <p className="lead">
                Every requirement you meet adds its weight to yours. You earn{" "}
                <strong style={{ color: "var(--ink-secondary)" }}>{earned}</strong> of the{" "}
                <strong style={{ color: "var(--ink-secondary)" }}>{total}</strong> weight this
                vacancy puts on the table, and {earned} divided by {total} is {result.score}%.
              </p>

              <div className="card stack" style={{ gap: 5 }}>
                <span style={{ fontSize: 13.5 }}>How the score is built</span>
                <p className="lead">
                  Every requirement carries a weight: a must-have is worth{" "}
                  {WEIGHTS["must-have"]}, a nice-to-have is worth {WEIGHTS["nice-to-have"]}. Your
                  score is the weight you earn divided by the weight on offer. No hidden factors and
                  no ranking by company. Skill names are matched loosely, so <code>Node.js</code>,{" "}
                  <code>node js</code> and <code>NodeJS</code> all count as one skill.
                </p>
              </div>
            </>
          )}
        </section>

        <section className="stack" style={{ gap: 14 }}>
          <span
            className="meta"
            style={{ letterSpacing: "1.3px", textTransform: "uppercase", color: "var(--faint)" }}
          >
            Close the gap
          </span>

          {result.breakdown.length === 0 ? (
            <EmptyState title="Nothing to close">
              This vacancy asks for no skills, so there is no gap to work on.
            </EmptyState>
          ) : missing.length === 0 ? (
            <div className="card stack" style={{ gap: 6 }}>
              <span style={{ fontSize: 15 }}>A full match</span>
              <p className="lead">
                You meet all {result.breakdown.length} requirements, must-haves included. There is
                nothing left to learn for this one — apply.
              </p>
            </div>
          ) : (
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
                  {missing.filter((r) => r.kind === "must-have").length > 0
                    ? "Must-haves are listed first: each one is worth three times a nice-to-have, so they move the score most."
                    : "Only nice-to-haves are missing, so every must-have this vacancy asks for is already on your profile."}
                </p>
              </div>

              {missing.slice(0, 3).map((requirement) => {
                const weight = WEIGHTS[requirement.kind];
                const potential = total === 0 ? 0 : Math.round(((earned + weight) / total) * 100);
                const gap = gapBySkill.get(normalizeSkill(requirement.skill));

                return (
                  <div
                    key={requirement.skill}
                    className="stack"
                    style={{
                      gap: 10,
                      paddingTop: 14,
                      borderTop: "1px solid var(--line)",
                    }}
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
                        ? `Asked for by ${gap.demandCount} of the ${vacancies.length} open vacancies` +
                          (gap.demandCount > 1
                            ? `, so learning it also lifts your score on ${gap.demandCount - 1} other${gap.demandCount - 1 === 1 ? "" : "s"}.`
                            : ", and this is the only one asking for it.")
                        : `Learning it takes this match to ${potential}%.`}
                    </p>
                  </div>
                );
              })}

              {missing.length > 3 && (
                <span className="meta">
                  {missing.length - 3} more missing requirement
                  {missing.length - 3 === 1 ? " is" : "s are"} listed above.
                </span>
              )}
            </div>
          )}

          <div className="card stack" style={{ gap: 12 }}>
            {application ? (
              <>
                <div className="split">
                  <span style={{ fontSize: 15 }}>You already applied</span>
                  <Chip tone="met">{STATUS_LABELS[application.status]}</Chip>
                </div>
                <span className="meta">Recorded on {shortDate(application.appliedAt)}.</span>
                <Link href="/applications" className="btn">
                  Track it on the board
                  <Icon name="arrowRight" size={16} strokeWidth={2.4} />
                </Link>
              </>
            ) : (
              <ApplyButton profileId={profile.id} vacancyId={vacancy.id} />
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
