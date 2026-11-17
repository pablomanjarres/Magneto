import Link from "next/link";
import { comparisonBlockers } from "@moonlight/core";

import { AppShell } from "../../components/AppShell";
import { CompletenessPanel } from "../../components/CompletenessPanel";
import { CountUp } from "../../components/CountUp";
import { MarketGaps } from "../../components/MarketGaps";
import { MatchLocked } from "../../components/MatchLocked";
import { ButtonLink, Card, EmptyState, Eyebrow, Stat } from "../../components/primitives";
import { Icon } from "../../components/Icon";
import { Laptop } from "../../components/toys/Laptop";
import { VacancyRow } from "../../components/VacancyRow";
import { loadAppliedIds, loadRanked, requireProfile } from "../../lib/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await requireProfile();

  const { vacancies, completeness, ranked, gaps } = await loadRanked(profile);
  const applied = await loadAppliedIds(profile.id);
  const byId = new Map(vacancies.map((v) => [v.id, v]));
  const top = ranked.slice(0, 3);
  const topGap = gaps[0];
  const firstName = profile.fullName.split(" ")[0];
  const complete = completeness.percentage === 100;
  const unscored = comparisonBlockers(profile).length > 0;

  const figures = [
    { value: ranked.length, label: "Vacantes evaluadas" },
    { value: unscored ? null : (ranked[0]?.score ?? 0), unit: "%", label: "Tu mejor match" },
    { value: applied.size, label: "Postulaciones" },
  ];

  return (
    <AppShell>
      <section className="relative isolate grid animate-pop overflow-hidden rounded-[32px] bg-navy text-white lg:grid-cols-[1.1fr_1fr]">
        {/* Aurora behind everything, in the two brand purples. */}
        <div className="pointer-events-none absolute -top-40 -left-24 -z-10 size-[520px] rounded-full bg-brand/45 blur-[110px] motion-safe:animate-aurora" />
        <div className="pointer-events-none absolute -right-24 -bottom-48 -z-10 size-[460px] rounded-full bg-brand-soft/30 blur-[120px] motion-safe:animate-aurora" />

        <div className="flex flex-col gap-6 p-7 sm:p-10">
          <div>
            <Eyebrow tone="mint">Hola, {firstName}</Eyebrow>
            <h1 className="mt-3 text-4xl font-black text-balance sm:text-5xl">
              Tu perfil está al <CountUp value={completeness.percentage} />%
            </h1>
            <p className="mt-3 max-w-md text-pretty text-white/75">
              {complete
                ? "Tu perfil está completo y cada vacante se evalúa con todo lo que sabes hacer."
                : "Cada campo que completas acerca mejores vacantes. Un perfil completo es lo que ve el reclutador."}
            </p>
          </div>

          <CompletenessPanel completeness={completeness} dark figure={false} />

          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/onboarding">
              {complete ? "Editar mi perfil" : "Completar mi perfil"}
              <Icon name="arrowRight" size={16} strokeWidth={2.4} />
            </ButtonLink>
            <Link
              href="/import"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/30 px-5 font-bold text-white transition hover:bg-white/10"
            >
              <Icon name="sparkles" size={15} />
              Importar LinkedIn o PDF
            </Link>
          </div>

          <dl className="mt-auto grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
            {figures.map((f) => (
              <Stat key={f.label} {...f} dark />
            ))}
          </dl>
        </div>

        <div className="relative h-[320px] lg:h-auto lg:min-h-[460px]">
          <Laptop
            profile={profile}
            completeness={completeness.percentage}
            href="/onboarding"
            caption={
              complete
                ? "Haz clic en tu portátil para editar tu perfil"
                : "Haz clic en tu portátil para completar tu perfil"
            }
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-black text-slate">Tus mejores coincidencias</h2>
            <Link href="/jobs" className="text-sm font-bold text-brand hover:underline">
              Ver las {ranked.length}
            </Link>
          </div>

          {top.length === 0 ? (
            <EmptyState title="Aún no hay vacantes evaluadas">
              Carga el dataset con <code>pnpm db:seed</code>.
            </EmptyState>
          ) : unscored ? (
            // Every score would tie at 0, so these would be "best" only by id.
            <MatchLocked vacancyCount={ranked.length} />
          ) : (
            top.map((result, index) => {
              const vacancy = byId.get(result.vacancyId);
              return vacancy ? (
                <div
                  key={result.vacancyId}
                  className="animate-rise"
                  style={{ animationDelay: `${150 + index * 90}ms` }}
                >
                  <VacancyRow
                    vacancy={vacancy}
                    result={result}
                    applied={applied.has(result.vacancyId)}
                  />
                </div>
              ) : null;
            })
          )}
        </section>

        <Card className="flex animate-rise flex-col gap-5 p-6 [animation-delay:250ms]">
          <div>
            <h2 className="text-xl font-black text-slate">Lo que pide el mercado</h2>
            <p className="mt-1 text-sm text-muted">
              Habilidades que no tienes, contadas en las {vacancies.length} vacantes abiertas.
            </p>
          </div>

          <MarketGaps gaps={gaps} total={vacancies.length} limit={5} />

          {topGap && (
            <p className="mt-auto flex gap-3 rounded-2xl bg-brand-wash p-4 text-sm text-ink">
              <span className="text-brand">
                <Icon name="sparkles" size={18} />
              </span>
              <span>
                Aprender <strong>{topGap.skill}</strong> sube tu puntaje en {topGap.demandCount} de
                las {vacancies.length} vacantes.
              </span>
            </p>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
