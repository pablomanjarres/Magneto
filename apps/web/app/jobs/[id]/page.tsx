import Link from "next/link";
import { notFound } from "next/navigation";
import { getVacancy, listApplications } from "@moonlight/db";
import { STATUS_LABELS, scoreVacancy } from "@moonlight/core";

import { AppShell } from "../../../components/AppShell";
import { Icon } from "../../../components/Icon";
import { Chip, EmptyState, Score } from "../../../components/primitives";
import { salaryRange, shortDate, workModeLabel } from "../../../lib/format";
import { loadProfile, loadRanked } from "../../../lib/queries";
import { ApplyButton } from "./ApplyButton";
import { CloseTheGap } from "./CloseTheGap";
import { ScoreBreakdown } from "./ScoreBreakdown";

export const dynamic = "force-dynamic";

const MUTED = { color: "var(--muted)" };

export default async function VacancyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, vacancy] = await Promise.all([loadProfile(), getVacancy(id)]);
  if (!vacancy) notFound();

  if (!profile) {
    return (
      <AppShell title="Vacancy">
        <EmptyState title="No candidate yet">
          A score needs a profile. Fill the wizard at <Link href="/onboarding">/onboarding</Link>,
          or seed the demo candidate with <code>pnpm db:seed</code>.
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
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: 28,
          alignItems: "center",
        }}
      >
        <div className="stack" style={{ gap: 12 }}>
          <h1 className="display" style={{ fontSize: 38 }}>
            {vacancy.title}
          </h1>
          <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, color: "var(--ink-secondary)" }}>{vacancy.company}</span>
            <span className="meta" style={MUTED}>
              {vacancy.city}
            </span>
            <span className="meta" style={MUTED}>
              {workModeLabel(vacancy.workMode)}
            </span>
            <span className="meta num" style={MUTED}>
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
        <ScoreBreakdown result={result} earned={earned} total={total} />

        <section className="stack" style={{ gap: 14 }}>
          <span
            className="meta"
            style={{ letterSpacing: "1.3px", textTransform: "uppercase", color: "var(--faint)" }}
          >
            Close the gap
          </span>

          <CloseTheGap
            result={result}
            earned={earned}
            total={total}
            gaps={gaps}
            vacancyCount={vacancies.length}
          />

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
