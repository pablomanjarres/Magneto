import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVacancy, listApplications } from "@moonlight/db";
import { comparisonBlockers, scoreVacancy } from "@moonlight/core";

import { AppShell } from "../../../components/AppShell";
import { Icon } from "../../../components/Icon";
import { ButtonLink, Card, Chip, Score } from "../../../components/primitives";
import { placeMeta, salaryRange } from "../../../lib/format";
import { loadRanked, requireProfile } from "../../../lib/queries";
import { ApplyButton } from "./ApplyButton";
import { CloseTheGap } from "./CloseTheGap";
import { ScoreBreakdown } from "./ScoreBreakdown";

export const dynamic = "force-dynamic";

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The score as a ring that draws itself once. `@starting-style` (Tailwind's
 * `starting:`) gives the empty ring as the first frame, so no client code is needed.
 */
function ScoreRing({ score }: { score: number }) {
  const offset = CIRCUMFERENCE * (1 - Math.max(0, Math.min(100, score)) / 100);
  return (
    <div className="relative grid size-40 shrink-0 place-items-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="score-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" className="[stop-color:var(--color-navy)]" />
            <stop offset="100%" className="[stop-color:var(--color-brand)]" />
          </linearGradient>
        </defs>
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="10"
          className="stroke-surface"
        />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="url(#score-ring)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          style={
            { "--ring-offset": `${offset}px`, "--ring-full": `${CIRCUMFERENCE}px` } as CSSProperties
          }
          className="[stroke-dashoffset:var(--ring-offset)] motion-safe:transition-[stroke-dashoffset] motion-safe:duration-[1400ms] motion-safe:ease-out motion-safe:starting:[stroke-dashoffset:var(--ring-full)]"
        />
      </svg>
      <Score score={score} large />
    </div>
  );
}

export default async function VacancyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, vacancy] = await Promise.all([requireProfile(), getVacancy(id)]);
  if (!vacancy) notFound();

  const result = scoreVacancy(profile, vacancy);
  const [{ vacancies, ranked, gaps }, applications] = await Promise.all([
    loadRanked(profile),
    listApplications(profile.id),
  ]);

  const application = applications.find((a) => a.vacancyId === vacancy.id);
  const rank = ranked.findIndex((r) => r.vacancyId === vacancy.id) + 1;
  const total = result.breakdown.reduce((sum, line) => sum + line.weight, 0);
  const earned = result.breakdown.reduce((sum, line) => sum + (line.met ? line.weight : 0), 0);
  const blockers = comparisonBlockers(profile);

  const facts = [
    { icon: "building", text: vacancy.company },
    { icon: "mapPin", text: placeMeta(vacancy) },
    { icon: "money", text: salaryRange(vacancy) },
  ] as const;

  return (
    <AppShell>
      <Link
        href="/jobs"
        className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold text-brand transition hover:bg-brand-wash"
      >
        <Icon name="arrowLeft" size={16} />
        Volver a vacantes
      </Link>

      <Card className="relative isolate flex animate-pop flex-col gap-6 overflow-hidden p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="pointer-events-none absolute -top-24 -right-24 -z-10 size-72 rounded-full bg-brand-wash blur-3xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {rank > 0 && (
            <Chip tone="brand">
              #{rank} de {ranked.length} para ti
            </Chip>
          )}
          <h1 className="text-3xl font-black text-balance text-slate sm:text-4xl">
            {vacancy.title}
          </h1>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
            {facts.map((fact) => (
              <span key={fact.icon} className="flex items-center gap-1.5">
                <Icon name={fact.icon} size={15} />
                {fact.text}
              </span>
            ))}
          </div>
          {blockers.length === 0 && (
            <ApplyButton profileId={profile.id} vacancyId={vacancy.id} application={application} />
          )}
        </div>
        {blockers.length === 0 && <ScoreRing score={result.score} />}
      </Card>

      {blockers.length > 0 ? (
        <Card className="flex animate-rise flex-col items-center gap-3 p-8 text-center [animation-delay:150ms]">
          <span className="grid size-12 place-items-center rounded-full bg-brand-wash text-brand">
            <Icon name="user" size={22} />
          </span>
          <h2 className="text-xl font-black text-slate">Completa tu perfil primero</h2>
          <p className="max-w-md text-sm text-pretty text-muted">
            Para calcular tu match necesitamos saber qué sabes hacer. Te falta:{" "}
            {blockers.join(", ").toLowerCase()}.
          </p>
          <ButtonLink href="/onboarding">
            Completar mi perfil
            <Icon name="arrowRight" size={16} strokeWidth={2.4} />
          </ButtonLink>
        </Card>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <ScoreBreakdown result={result} earned={earned} total={total} />
          <CloseTheGap
            result={result}
            earned={earned}
            total={total}
            gaps={gaps}
            vacancyCount={vacancies.length}
          />
        </div>
      )}
    </AppShell>
  );
}
