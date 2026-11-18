import { comparisonBlockers } from "@moonlight/core";

import { AppShell } from "../../components/AppShell";
import { MatchLocked } from "../../components/MatchLocked";
import { EmptyState } from "../../components/primitives";
import { VacancyRow } from "../../components/VacancyRow";
import { loadApplied, loadRanked, requireProfile } from "../../lib/queries";
import { VacancyFilters, type VacancyListItem } from "./VacancyFilters";
import { VacancyPreview } from "./VacancyPreview";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const profile = await requireProfile();

  const { vacancies, ranked } = await loadRanked(profile);
  const applied = await loadApplied(profile.id);
  const byId = new Map(vacancies.map((v) => [v.id, v]));
  const unscored = comparisonBlockers(profile).length > 0;

  // rankVacancies drops vacancies with no requirements, so the list is built
  // from the ranked results and never from the raw vacancy set.
  const items: VacancyListItem[] = ranked.flatMap((result, rank) => {
    const vacancy = byId.get(result.vacancyId);
    if (!vacancy) return [];
    const application = applied.get(vacancy.id);
    return [
      {
        id: vacancy.id,
        title: vacancy.title,
        company: vacancy.company,
        city: vacancy.city,
        workMode: vacancy.workMode,
        applied: application !== undefined,
        rank,
        salaryMax: vacancy.salaryMax ?? vacancy.salaryMin,
        // Searching requirements is what makes "React" find the vacancies that
        // ask for it rather than only the ones with it in the title.
        skills: vacancy.requirements.map((r) => r.skill).join(" "),
        row: (
          <VacancyRow
            vacancy={vacancy}
            result={result}
            applied={application !== undefined}
            unscored={unscored}
          />
        ),
        preview: (
          <VacancyPreview
            vacancy={vacancy}
            result={result}
            profileId={profile.id}
            application={application}
            unscored={unscored}
          />
        ),
      },
    ];
  });

  const unique = (values: string[]): string[] =>
    [...new Set(values)].sort((a, b) => a.localeCompare(b, "es"));

  return (
    <AppShell>
      {unscored && <MatchLocked vacancyCount={items.length} />}

      {items.length === 0 ? (
        <EmptyState title="Aún no hay vacantes evaluadas">
          Una vacante necesita al menos un requisito para evaluarse. Carga el dataset con{" "}
          <code>pnpm db:seed</code>.
        </EmptyState>
      ) : (
        <VacancyFilters
          // Without skills every score is 0 and the order is only the dataset's.
          title={unscored ? "Vacantes abiertas" : "Vacantes ordenadas por tu match"}
          items={items}
          cities={unique(items.map((item) => item.city))}
          companies={unique(items.map((item) => item.company))}
        />
      )}
    </AppShell>
  );
}
