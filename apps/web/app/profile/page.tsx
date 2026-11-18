import { profileCompleteness } from "@moonlight/core";

import { AppShell } from "../../components/AppShell";
import { CompletenessPanel } from "../../components/CompletenessPanel";
import {
  ButtonLink,
  Card,
  Chip,
  EmptyState,
  Eyebrow,
  PageHeader,
} from "../../components/primitives";
import { Icon } from "../../components/Icon";
import { Initials } from "../../components/ProfileSwitcher";
import { SourceChip } from "../../components/SourceChip";
import { isSampleProfile, requireProfile } from "../../lib/queries";
import { profileName, salaryRange, shortDate, workModeLabel } from "../../lib/format";
import { DeleteProfile } from "./DeleteProfile";
import { Detail, type Entry, EntryList, ProfileSection } from "./ProfileSection";

export const dynamic = "force-dynamic";

const NOT_STATED = "Sin definir";

/** Profile dates carry month precision ("2023-02"), so printing a day would invent one. */
const monthLabel = (iso: string): string =>
  /^\d{4}-\d{2}$/.test(iso)
    ? new Date(`${iso}-01`).toLocaleDateString("es-CO", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : shortDate(iso);

const period = (start: string, end: string | undefined): string =>
  `${monthLabel(start)} – ${end ? monthLabel(end) : "Actualidad"}`;

const years = (start: number, end: number | undefined): string =>
  `${start} – ${end ?? "Actualidad"}`;

export default async function ProfilePage() {
  const profile = await requireProfile();

  const completeness = profileCompleteness(profile);
  const expectations = profile.expectations;
  const hasSalary = expectations.salaryMin !== undefined || expectations.salaryMax !== undefined;

  // Newest first, whatever order the wizard saved.
  const experience: Entry[] = [...profile.experience]
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .map((job) => ({
      key: `${job.company}-${job.title}-${job.startDate}`,
      title: job.title,
      period: period(job.startDate, job.endDate),
      subtitle: job.company,
      description: job.description,
      source: job.source,
    }));

  const education: Entry[] = [...profile.education]
    .sort((a, b) => b.startYear - a.startYear)
    .map((degree) => ({
      key: `${degree.institution}-${degree.degree}-${degree.startYear}`,
      title: degree.degree,
      period: years(degree.startYear, degree.endYear),
      subtitle: degree.institution,
      source: degree.source,
    }));

  const facts = [
    { icon: "mapPin", text: profile.city || "Ciudad sin definir" },
    { icon: "target", text: expectations.targetRole || "Cargo objetivo sin definir" },
  ] as const;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Mi perfil"
        title={profileName(profile.fullName)}
        lead="Este es el perfil con el que se construyen tus postulaciones. Si cambias algo, cada vacante se vuelve a evaluar."
        actions={
          <>
            <ButtonLink href="/onboarding">
              <Icon name="edit" size={16} />
              Editar perfil
            </ButtonLink>
            <ButtonLink href="/cv" variant="quiet">
              <Icon name="document" size={16} />
              Ver mi hoja de vida
            </ButtonLink>
          </>
        }
      />

      <Card className="grid animate-rise gap-8 p-6 [animation-delay:80ms] sm:p-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex items-center gap-5">
          <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-brand-wash text-2xl font-black text-brand">
            <Initials fullName={profile.fullName} size={30} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-2xl font-black text-slate">
              {profileName(profile.fullName)}
            </p>
            <p className="truncate text-sm text-muted">{profile.email || "Correo sin definir"}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {facts.map((fact) => (
                <li
                  key={fact.icon}
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-[13px] font-bold text-ink"
                >
                  <span className="text-brand">
                    <Icon name={fact.icon} size={14} />
                  </span>
                  {fact.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:border-l lg:border-line lg:pl-8">
          <div className="mb-3">
            <Eyebrow>Completitud del perfil</Eyebrow>
          </div>
          <CompletenessPanel completeness={completeness} linked />
        </div>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <ProfileSection
            title="Experiencia"
            hint="Lo más reciente primero."
            icon="briefcase"
            className="[animation-delay:150ms]"
          >
            <EntryList entries={experience} empty="Aún no tienes cargos">
              Agrégalos desde Editar perfil.
            </EntryList>
          </ProfileSection>

          <ProfileSection
            title="Educación"
            hint="Tus títulos y los años en que los estudiaste."
            icon="graduation"
            className="[animation-delay:220ms]"
          >
            <EntryList entries={education} empty="Aún no tienes estudios">
              Con uno basta, aunque no lo hayas terminado.
            </EntryList>
          </ProfileSection>
        </div>

        <div className="flex flex-col gap-6">
          <ProfileSection
            title="Habilidades"
            hint="Cada puntaje de coincidencia se calcula con esta lista."
            icon="sparkles"
            className="[animation-delay:190ms]"
          >
            {profile.skills.length === 0 ? (
              <EmptyState title="Aún no tienes habilidades">
                Son la base de tu puntaje: agrégalas desde Editar perfil.
              </EmptyState>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Chip key={skill.name} tone="brand">
                    {skill.name}
                    {skill.source && <SourceChip source={skill.source} />}
                  </Chip>
                ))}
              </div>
            )}
          </ProfileSection>

          <ProfileSection
            title="Expectativas"
            hint="Qué buscas y dónde."
            icon="money"
            className="[animation-delay:260ms]"
          >
            <dl className="flex flex-col gap-3">
              <Detail label="Cargo objetivo">{expectations.targetRole || NOT_STATED}</Detail>
              <Detail label="Área">{expectations.targetArea ?? NOT_STATED}</Detail>
              <Detail label="Nivel">{expectations.targetSeniority ?? NOT_STATED}</Detail>

              <Detail label="Salario mensual">
                <span className="font-black text-navy tabular-nums">
                  {hasSalary ? salaryRange(expectations) : NOT_STATED}
                </span>
              </Detail>

              <Detail label="Modalidad">
                {expectations.workModes.length === 0
                  ? NOT_STATED
                  : expectations.workModes.map((mode) => (
                      <Chip key={mode}>{workModeLabel(mode)}</Chip>
                    ))}
              </Detail>

              <Detail label="Reubicación">
                {expectations.willRelocate === undefined
                  ? NOT_STATED
                  : expectations.willRelocate
                    ? "Dispuesto a reubicarme"
                    : "Prefiero no reubicarme"}
              </Detail>

              {expectations.cities.length > 0 && (
                <Detail label="Ciudades">
                  {expectations.cities.map((city) => (
                    <Chip key={city}>{city}</Chip>
                  ))}
                </Detail>
              )}
            </dl>
          </ProfileSection>

          {/* Left-aligned and narrow: Luna and its greeting float over the bottom right corner. */}
          {!isSampleProfile(profile.id) && (
            <DeleteProfile profileId={profile.id} name={profile.fullName.trim()} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
