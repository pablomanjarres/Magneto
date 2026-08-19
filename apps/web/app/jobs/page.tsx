import { Fragment } from "react";

import { AppShell } from "../../components/AppShell";
import { EmptyState } from "../../components/primitives";
import { VacancyRow } from "../../components/VacancyRow";
import { loadAppliedIds, loadRanked, requireProfile } from "../../lib/queries";
import { VacancyFilters, type VacancyListItem } from "./VacancyFilters";

export const dynamic = "force-dynamic";

function Stat({ value, label, tone }: { value: string; label: string; tone?: "gold" }) {
  return (
    <div className="stack" style={{ gap: 2, padding: "0 26px" }}>
      <span
        className="display num"
        style={{ color: tone === "gold" ? "var(--gold-deep)" : "var(--ink-active)" }}
      >
        {value}
      </span>
      <span className="meta" style={{ whiteSpace: "nowrap" }}>
        {label}
      </span>
    </div>
  );
}

export default async function JobsPage() {
  const profile = await requireProfile();

  const { vacancies, ranked } = await loadRanked(profile);
  const applied = await loadAppliedIds(profile.id);
  const byId = new Map(vacancies.map((v) => [v.id, v]));

  // rankVacancies drops vacancies with no requirements, so the list is built
  // from the ranked results and never from the raw vacancy set.
  const items: VacancyListItem[] = ranked.flatMap((result) => {
    const vacancy = byId.get(result.vacancyId);
    if (!vacancy) return [];
    const isApplied = applied.has(vacancy.id);
    return [
      {
        id: vacancy.id,
        title: vacancy.title,
        company: vacancy.company,
        city: vacancy.city,
        workMode: vacancy.workMode,
        applied: isApplied,
        // Searching requirements is what makes "React" find the vacancies that
        // ask for it rather than only the ones with it in the title.
        skills: vacancy.requirements.map((r) => r.skill).join(" "),
        row: <VacancyRow vacancy={vacancy} result={result} applied={isApplied} />,
      },
    ];
  });

  const unique = (values: string[]): string[] =>
    [...new Set(values)].sort((a, b) => a.localeCompare(b));
  const best = ranked[0]?.score ?? 0;
  const appliedCount = items.filter((item) => item.applied).length;

  const stats: ReadonlyArray<{ value: string; label: string; tone?: "gold" }> = [
    { value: String(items.length), label: "Vacancies scored" },
    { value: `${best}%`, label: "Best match", tone: "gold" },
    { value: String(appliedCount), label: "Already applied" },
  ];

  return (
    <AppShell title="Vacancies" meta={`${items.length} vacancies scored`}>
      <section
        className="panel"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: 32,
          alignItems: "center",
        }}
      >
        <div className="stack" style={{ gap: 8 }}>
          <h1 className="display">Every vacancy, best match first</h1>
          <p className="lead">
            The number on each row is the share of that vacancy&apos;s requirements you already
            meet, with a must-have counting three times a nice-to-have. Nothing is hidden from you —
            the order is the recommendation, and the chips are what is missing.
          </p>
        </div>

        <div className="row" style={{ gap: 0, alignSelf: "stretch" }}>
          {stats.map((stat, index) => (
            <Fragment key={stat.label}>
              {index > 0 && <div className="divider" />}
              {stat.tone ? (
                <Stat value={stat.value} label={stat.label} tone={stat.tone} />
              ) : (
                <Stat value={stat.value} label={stat.label} />
              )}
            </Fragment>
          ))}
        </div>
      </section>

      {items.length === 0 ? (
        <EmptyState title="No vacancies scored yet">
          A vacancy needs at least one requirement to be scored. Seed the dataset with{" "}
          <code>pnpm db:seed</code>.
        </EmptyState>
      ) : (
        <VacancyFilters
          items={items}
          cities={unique(items.map((item) => item.city))}
          companies={unique(items.map((item) => item.company))}
        />
      )}
    </AppShell>
  );
}
