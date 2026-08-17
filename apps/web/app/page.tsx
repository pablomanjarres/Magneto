import type { Vacancy } from "@moonlight/types";
import { getProfile, listVacancies } from "@moonlight/db";
import { marketGaps, profileCompleteness, rankVacancies } from "@moonlight/core";

export const dynamic = "force-dynamic";

const gold = "#e0a642";

export default async function Home() {
  const profile = await getProfile("demo-candidate");
  const vacancies = await listVacancies();

  if (!profile) {
    return (
      <main>
        <h1>Moon Light</h1>
        <p>
          No profile seeded yet. Run <code>pnpm db:migrate &amp;&amp; pnpm db:seed</code>, then POST
          <code> data/sample-profiles/candidate.json</code> to <code>/api/profiles</code>.
        </p>
      </main>
    );
  }

  const completeness = profileCompleteness(profile);
  const ranked = rankVacancies(profile, vacancies);
  const gaps = marketGaps(profile, vacancies);
  const byId = new Map<string, Vacancy>(vacancies.map((v) => [v.id, v]));

  return (
    <main style={{ maxWidth: 820, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 0 }}>Moon Light</h1>
      <p style={{ opacity: 0.7, marginTop: 4 }}>
        {profile.fullName} · {vacancies.length} vacancies scored
      </p>

      <h2>Profile completeness</h2>
      <div style={{ background: "#1c1f26", borderRadius: 6, height: 14, overflow: "hidden" }}>
        <div style={{ width: `${completeness.percentage}%`, background: gold, height: "100%" }} />
      </div>
      <p>
        <strong>{completeness.percentage}%</strong>
        {completeness.missing.length > 0 && ` · missing: ${completeness.missing.join(", ")}`}
      </p>

      <h2>What the market asks for that you do not have</h2>
      <ol>
        {gaps.slice(0, 5).map((g) => (
          <li key={g.skill}>
            <strong>{g.skill}</strong> — {g.demandCount} vacancies ({g.sharePercent}%)
          </li>
        ))}
      </ol>

      <h2>Ranked vacancies</h2>
      {ranked.map((r) => {
        const v = byId.get(r.vacancyId);
        return (
          <article
            key={r.vacancyId}
            style={{ borderTop: "1px solid #2a2e37", padding: "0.85rem 0" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
              <strong>
                {v?.title} · {v?.company}
              </strong>
              <span style={{ color: gold }}>{r.score}%</span>
            </div>
            <div style={{ opacity: 0.7, fontSize: "0.9rem" }}>{r.reason}</div>
            {r.missing.length > 0 && (
              <div style={{ opacity: 0.55, fontSize: "0.85rem" }}>
                missing: {r.missing.map((m) => m.skill).join(", ")}
              </div>
            )}
          </article>
        );
      })}
    </main>
  );
}
