import { AppShell } from "../../components/AppShell";
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
        row: <VacancyRow vacancy={vacancy} result={result} applied={isApplied} />,
      },
    ];
  });

  const unique = (values: string[]): string[] =>
    [...new Set(values)].sort((a, b) => a.localeCompare(b, "es"));

  const stats = [
    { value: items.length, label: "vacantes evaluadas" },
    { value: ranked[0]?.score ?? 0, label: "% mejor match", accent: true },
    { value: items.filter((item) => item.applied).length, label: "ya postulado" },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Vacantes"
        title="Vacantes ordenadas por tu match"
        lead="El número de cada vacante es la parte de sus requisitos que ya cumples; un obligatorio vale tres veces un deseable. Las etiquetas rojas son lo que te falta."
      />

      <Card className="grid animate-rise grid-cols-3 divide-x divide-line p-5 [animation-delay:60ms]">
        {stats.map((stat) => (
          <div key={stat.label} className="px-4 first:pl-1">
            <Stat value={String(stat.value)} label={stat.label} accent={stat.accent ?? false} />
          </div>
        ))}
      </Card>

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
