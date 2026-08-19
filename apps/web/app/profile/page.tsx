import Link from "next/link";

import { AppShell } from "../../components/AppShell";
import { CompletenessPanel, filledFieldsLabel } from "../../components/CompletenessPanel";
import { Chip, EmptyState } from "../../components/primitives";
import { Icon } from "../../components/Icon";
import { loadProfile } from "../../lib/queries";
import { salaryRange, shortDate, workModeLabel } from "../../lib/format";
import { profileCompleteness } from "@moonlight/core";
import { Detail, type Entry, EntryList, ProfileSection } from "./ProfileSection";

export const dynamic = "force-dynamic";

/** Profile dates carry month precision ("2023-02"), so printing a day would invent one. */
const monthLabel = (iso: string): string =>
  /^\d{4}-\d{2}$/.test(iso)
    ? new Date(`${iso}-01`).toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : shortDate(iso);

const period = (start: string, end: string | undefined): string =>
  `${monthLabel(start)} – ${end ? monthLabel(end) : "Present"}`;

const years = (start: number, end: number | undefined): string => `${start} – ${end ?? "Present"}`;

export default async function ProfilePage() {
  const profile = await loadProfile();
  if (!profile) {
    return (
      <AppShell title="Profile">
        <EmptyState title="No profile yet">
          Fill the wizard at <Link href="/onboarding">/onboarding</Link> and it shows up here.
        </EmptyState>
      </AppShell>
    );
  }

  const completeness = profileCompleteness(profile);
  const expectations = profile.expectations;
  const hasSalary = expectations.salaryMin !== undefined || expectations.salaryMax !== undefined;

  // Newest first, so the hint on each card holds whatever order the wizard saved.
  const experience: Entry[] = [...profile.experience]
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .map((job) => ({
      key: `${job.company}-${job.title}-${job.startDate}`,
      title: job.title,
      period: period(job.startDate, job.endDate),
      subtitle: job.company,
      description: job.description,
    }));

  const education: Entry[] = [...profile.education]
    .sort((a, b) => b.startYear - a.startYear)
    .map((degree) => ({
      key: `${degree.institution}-${degree.degree}-${degree.startYear}`,
      title: degree.degree,
      period: years(degree.startYear, degree.endYear),
      subtitle: degree.institution,
    }));

  return (
    <AppShell title="Profile" meta={filledFieldsLabel(completeness)}>
      <section
        className="panel"
        style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: 32 }}
      >
        <div className="stack" style={{ gap: 14 }}>
          <div className="stack" style={{ gap: 6 }}>
            <h1 className="display">{profile.fullName}</h1>
            <span className="meta" style={{ color: "var(--muted)" }}>
              {profile.email}
              {profile.city ? ` · ${profile.city}` : ""}
            </span>
          </div>

          <CompletenessPanel
            completeness={completeness}
            heading={<span className="meta">Profile completeness</span>}
            detail={`${completeness.percentage}%`}
          />
        </div>

        <div
          className="stack"
          style={{ justifyContent: "center", borderLeft: "1px solid var(--line)", paddingLeft: 32 }}
        >
          <p className="lead">
            This is the profile your applications are built from. Change anything here and every
            vacancy is scored again.
          </p>
          <Link href="/onboarding" className="btn btn--primary">
            Edit my profile
            <Icon name="arrowRight" size={16} strokeWidth={2.4} />
          </Link>
        </div>
      </section>

      <div className="two-col">
        <div className="stack" style={{ gap: 22 }}>
          <ProfileSection title="Experience" hint="Most recent first.">
            <EntryList entries={experience} empty="No positions listed yet" />
          </ProfileSection>

          <ProfileSection title="Education" hint="Degrees and the years you studied them.">
            <EntryList entries={education} empty="No education listed yet" />
          </ProfileSection>
        </div>

        <div className="stack" style={{ gap: 22 }}>
          <ProfileSection title="Skills" hint="Every match score is calculated from this list.">
            {profile.skills.length === 0 ? (
              <EmptyState title="No skills listed yet" />
            ) : (
              <div className="chips">
                {profile.skills.map((skill) => (
                  <Chip key={skill.name} tone="met">
                    {skill.name}
                  </Chip>
                ))}
              </div>
            )}
          </ProfileSection>

          <ProfileSection title="Expectations" hint="What you are looking for, and where.">
            <div className="stack" style={{ gap: 12 }}>
              <Detail label="Target role">{expectations.targetRole ?? "Not stated"}</Detail>

              <Detail label="Salary, monthly">
                <span className="num">{hasSalary ? salaryRange(expectations) : "Not stated"}</span>
              </Detail>

              <Detail label="Work mode">
                {expectations.workModes.length === 0
                  ? "Not stated"
                  : expectations.workModes.map((mode) => (
                      <Chip key={mode}>{workModeLabel(mode)}</Chip>
                    ))}
              </Detail>

              <Detail label="Relocation">
                {expectations.willRelocate ? "Willing to relocate" : "Staying put"}
              </Detail>

              {expectations.cities.length > 0 && (
                <Detail label="Cities">
                  {expectations.cities.map((city) => (
                    <Chip key={city}>{city}</Chip>
                  ))}
                </Detail>
              )}
            </div>
          </ProfileSection>
        </div>
      </div>
    </AppShell>
  );
}
