import Link from "next/link";

import { AppShell } from "../../components/AppShell";
import { CompletenessPanel, filledFieldsLabel } from "../../components/CompletenessPanel";
import { EmptyState } from "../../components/primitives";
import { Icon } from "../../components/Icon";
import { MarketGaps } from "../../components/MarketGaps";
import { NoProfile } from "../../components/NoProfile";
import { VacancyRow } from "../../components/VacancyRow";
import { loadAppliedIds, loadProfile, loadRanked } from "../../lib/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await loadProfile();
  if (!profile) return <NoProfile title="Dashboard" />;

  const { vacancies, completeness, ranked, gaps } = await loadRanked(profile);
  const applied = await loadAppliedIds(profile.id);
  const byId = new Map(vacancies.map((v) => [v.id, v]));
  const top = ranked.slice(0, 3);
  const topGap = gaps[0];

  return (
    <AppShell title="Dashboard" meta={`${ranked.length} vacancies scored`}>
      <section
        className="panel"
        style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: 32 }}
      >
        <CompletenessPanel
          completeness={completeness}
          heading={<h1 className="display">Your profile is {completeness.percentage}% complete</h1>}
          detail={filledFieldsLabel(completeness)}
        />

        <div
          className="stack"
          style={{ justifyContent: "center", borderLeft: "1px solid var(--line)", paddingLeft: 32 }}
        >
          <p className="lead">
            Your matches are already scored — completeness does not gate that. The empty fields are
            what a recruiter sees missing.
          </p>
          <Link href="/onboarding" className="btn btn--primary">
            Finish my profile
            <Icon name="arrowRight" size={16} strokeWidth={2.4} />
          </Link>
        </div>
      </section>

      <div className="two-col">
        <section className="stack">
          <div className="split">
            <h2 className="h2">Your top matches</h2>
            <Link href="/jobs" className="meta" style={{ color: "var(--glow)" }}>
              See all {ranked.length}
            </Link>
          </div>

          {top.length === 0 ? (
            <EmptyState title="No vacancies scored yet">
              Seed the dataset with <code>pnpm db:seed</code>.
            </EmptyState>
          ) : (
            top.map((result) => {
              const vacancy = byId.get(result.vacancyId);
              return vacancy ? (
                <VacancyRow
                  key={result.vacancyId}
                  vacancy={vacancy}
                  result={result}
                  applied={applied.has(result.vacancyId)}
                />
              ) : null;
            })
          )}
        </section>

        <section className="card stack" style={{ gap: 14, padding: "20px 22px" }}>
          <div className="stack" style={{ gap: 5 }}>
            <h2 className="h2">What the market asks for</h2>
            <span className="meta" style={{ textWrap: "pretty" }}>
              Skills you have not listed, counted across all {vacancies.length} open vacancies.
              Close the top one first.
            </span>
          </div>

          <MarketGaps gaps={gaps} limit={5} />

          {topGap && (
            <p
              className="lead"
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                marginTop: "auto",
                padding: "12px 14px",
                borderRadius: 10,
                background: "var(--wash)",
                border: "1px solid var(--line-strong)",
                color: "var(--ink-secondary)",
              }}
            >
              <span style={{ color: "var(--glow)" }}>
                <Icon name="check" size={18} />
              </span>
              <span>
                Learning <strong>{topGap.skill}</strong> alone would raise your score on{" "}
                {topGap.demandCount} of the {vacancies.length}.
              </span>
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
