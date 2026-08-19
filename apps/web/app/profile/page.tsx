import type { ReactNode } from "react";
import Link from "next/link";
import type { Education, Experience } from "@moonlight/types";

import { AppShell } from "../../components/AppShell";
import { Chip, EmptyState, ProgressBar } from "../../components/primitives";
import { Icon } from "../../components/Icon";
import { loadProfile } from "../../lib/queries";
import { salaryRange, shortDate, workModeLabel } from "../../lib/format";
import { COMPLETENESS_FIELDS, profileCompleteness } from "@moonlight/core";

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

function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="card stack" style={{ gap: 14, padding: "20px 22px" }}>
      <div className="stack" style={{ gap: 5 }}>
        <h2 className="h2">{title}</h2>
        <span className="meta" style={{ textWrap: "pretty" }}>
          {hint}
        </span>
      </div>
      {children}
    </section>
  );
}

/** One label-and-value line. Expectations are five of them, never five copies. */
function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="row" style={{ gap: 14, alignItems: "flex-start" }}>
      <span className="meta" style={{ width: 116, flexShrink: 0, paddingTop: 2 }}>
        {label}
      </span>
      <div
        className="grow"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 7,
          fontSize: 13,
          color: "var(--ink-secondary)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Items inside a card are split by a rule rather than a gap, so long lists stay readable. */
function Entry({ index, children }: { index: number; children: ReactNode }) {
  return (
    <div
      className="stack"
      style={
        index === 0 ? { gap: 4 } : { gap: 4, paddingTop: 14, borderTop: "1px solid var(--line)" }
      }
    >
      {children}
    </div>
  );
}

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
  const filled = COMPLETENESS_FIELDS.length - completeness.missing.length;
  const expectations = profile.expectations;
  const hasSalary = expectations.salaryMin !== undefined || expectations.salaryMax !== undefined;

  // Newest first, so the hint on each card holds whatever order the wizard saved.
  const experience: Experience[] = [...profile.experience].sort((a, b) =>
    b.startDate.localeCompare(a.startDate),
  );
  const education: Education[] = [...profile.education].sort((a, b) => b.startYear - a.startYear);

  return (
    <AppShell title="Profile" meta={`${filled} of ${COMPLETENESS_FIELDS.length} fields`}>
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

          <div className="split">
            <span className="meta">Profile completeness</span>
            <span className="meta num">{completeness.percentage}%</span>
          </div>

          <ProgressBar percentage={completeness.percentage} />

          <div className="chips">
            <span className="meta" style={{ color: "var(--muted)" }}>
              Missing:
            </span>
            {completeness.missing.length === 0 ? (
              <span className="meta" style={{ color: "var(--gold)" }}>
                nothing — every field is filled.
              </span>
            ) : (
              completeness.missing.map((label) => (
                <Chip key={label} tone="dashed">
                  {label}
                </Chip>
              ))
            )}
          </div>
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
          <Section title="Experience" hint="Most recent first.">
            {experience.length === 0 ? (
              <EmptyState title="No positions listed yet" />
            ) : (
              experience.map((job, index) => (
                <Entry key={`${job.company}-${job.title}-${job.startDate}`} index={index}>
                  <div className="split">
                    <span style={{ fontSize: 14.5, fontWeight: 500 }}>{job.title}</span>
                    <span className="meta num" style={{ whiteSpace: "nowrap" }}>
                      {period(job.startDate, job.endDate)}
                    </span>
                  </div>
                  <span className="meta" style={{ color: "var(--muted)" }}>
                    {job.company}
                  </span>
                  {job.description && (
                    <p className="lead" style={{ paddingTop: 2 }}>
                      {job.description}
                    </p>
                  )}
                </Entry>
              ))
            )}
          </Section>

          <Section title="Education" hint="Degrees and the years you studied them.">
            {education.length === 0 ? (
              <EmptyState title="No education listed yet" />
            ) : (
              education.map((degree, index) => (
                <Entry
                  key={`${degree.institution}-${degree.degree}-${degree.startYear}`}
                  index={index}
                >
                  <div className="split">
                    <span style={{ fontSize: 14.5, fontWeight: 500 }}>{degree.degree}</span>
                    <span className="meta num" style={{ whiteSpace: "nowrap" }}>
                      {years(degree.startYear, degree.endYear)}
                    </span>
                  </div>
                  <span className="meta" style={{ color: "var(--muted)" }}>
                    {degree.institution}
                  </span>
                </Entry>
              ))
            )}
          </Section>
        </div>

        <div className="stack" style={{ gap: 22 }}>
          <Section title="Skills" hint="Every match score is calculated from this list.">
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
          </Section>

          <Section title="Expectations" hint="What you are looking for, and where.">
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
          </Section>
        </div>
      </div>
    </AppShell>
  );
}
