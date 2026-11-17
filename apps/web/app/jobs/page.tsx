import { MATCH_BANDS, comparisonBlockers } from "@moonlight/core";

import { AppShell } from "../../components/AppShell";
import { MatchLocked } from "../../components/MatchLocked";
import { Card, EmptyState, PageHeader, Stat } from "../../components/primitives";
import { VacancyRow } from "../../components/VacancyRow";
import { loadAppliedIds, loadRanked, requireProfile } from "../../lib/queries";
import { VacancyFilters, type VacancyListItem } from "./VacancyFilters";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const profile = await requireProfile();

  const { vacancies, ranked } = await loadRanked(profile);
  const applied = await loadAppliedIds(profile.id);
  const byId = new Map(vacancies.map((v) => [v.id, v]));
  const unscored = comparisonBlockers(profile).length > 0;

  // rankVacancies drops vacancies with no requirements, so the list is built
  // from the ranked results and never from the raw vacancy set.
  const items: VacancyListItem[] = ranked.flatMap((result, rank) => {
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
        rank,
        salaryMax: vacancy.salaryMax ?? vacancy.salaryMin,
        // Searching requirements is what makes "React" find the vacancies that
        // ask for it rather than only the ones with it in the title.
        skills: vacancy.requirements.map((r) => r.skill).join(" "),
        row: (
          <VacancyRow vacancy={vacancy} result={result} applied={isApplied} unscored={unscored} />
        ),
      },
    ];
  });

  const unique = (values: string[]): string[] =>
    [...new Set(values)].sort((a, b) => a.localeCompare(b, "es"));

  const stats = [
    { value: items.length, label: "Vacantes evaluadas" },
    {
      value: unscored ? null : (ranked[0]?.score ?? 0),
      unit: "%",
      label: "Tu mejor match",
      accent: true,
    },
    { value: items.filter((item) => item.applied).length, label: "Postulaciones" },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Vacantes"
        // Without skills every score is 0 and the order is only the dataset's.
        title={unscored ? "Vacantes abiertas" : "Vacantes ordenadas por tu match"}
        lead={`El número de cada vacante es la parte de sus requisitos que ya cumples; un obligatorio vale tres veces un deseable. Desde ${MATCH_BANDS.alto}% el match es alto y desde ${MATCH_BANDS.medio}%, medio. Las etiquetas rojas son lo que te falta.`}
      />

      <Card className="animate-rise p-5 [animation-delay:60ms]">
        <dl className="grid grid-cols-3 divide-x divide-line">
          {stats.map((stat) => (
            <Stat key={stat.label} {...stat} className="px-4 first:pl-1" />
          ))}
        </dl>
      </Card>

      {unscored && <MatchLocked vacancyCount={items.length} />}

      {items.length === 0 ? (
        <EmptyState title="Aún no hay vacantes evaluadas">
          Una vacante necesita al menos un requisito para evaluarse. Carga el dataset con{" "}
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
