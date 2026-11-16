import Link from "next/link";

import { AppShell } from "../../components/AppShell";
import { CompletenessPanel } from "../../components/CompletenessPanel";
import { CountUp } from "../../components/CountUp";
import { MarketGaps } from "../../components/MarketGaps";
import { MoonHero } from "../../components/moon/MoonHero";
import { ButtonLink, Card, EmptyState, Eyebrow } from "../../components/primitives";
import { Icon } from "../../components/Icon";
import { VacancyRow } from "../../components/VacancyRow";
import { loadAppliedIds, loadRanked, requireProfile } from "../../lib/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await requireProfile();

  const { vacancies, completeness, ranked, gaps } = await loadRanked(profile);
  const applied = await loadAppliedIds(profile.id);
  const byId = new Map(vacancies.map((v) => [v.id, v]));
  const top = ranked.slice(0, 3);
  // The five best matches orbit the moon in the hero; clicking one opens it.
  const satellites = ranked.slice(0, 5).map((r) => ({
    id: r.vacancyId,
    title: byId.get(r.vacancyId)?.title ?? r.vacancyId,
    score: r.score,
  }));
  const topGap = gaps[0];
  const firstName = profile.fullName.split(" ")[0];
  const complete = completeness.percentage === 100;

  const figures = [
    { value: ranked.length, label: "vacantes evaluadas" },
    { value: ranked[0]?.score ?? 0, label: "% tu mejor match" },
    { value: applied.size, label: "postulaciones" },
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
                ? "Luna llena. Tu perfil está completo y cada vacante se evalúa con todo lo que sabes hacer."
                : "Cada campo que completas ilumina un poco más tu luna. Un perfil completo es lo que ve el reclutador."}
            </p>
          </div>

          <CompletenessPanel completeness={completeness} dark />

          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/onboarding">
              {complete ? "Editar mi perfil" : "Completar mi perfil"}
              <Icon name="arrowRight" size={16} strokeWidth={2.4} />
            </ButtonLink>
            <Link
              href="/jobs"
              className="inline-flex h-11 items-center rounded-full border border-white/30 px-5 font-bold text-white transition hover:bg-white/10"
            >
              Ver vacantes
            </Link>
          </div>

          <dl className="mt-auto grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
            {figures.map((f) => (
              <div key={f.label}>
                <dt className="sr-only">{f.label}</dt>
                <dd className="text-3xl font-black">
                  <CountUp value={f.value} />
                </dd>
                <p className="text-xs text-white/65">{f.label}</p>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative h-[320px] lg:h-auto lg:min-h-[460px]">
          <MoonHero
            percentage={completeness.percentage}
            satellites={satellites}
            moonHref="/onboarding"
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

          <MarketGaps gaps={gaps} limit={5} />

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
