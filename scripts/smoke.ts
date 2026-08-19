/**
 * The MVP flow end to end, against the real database: a profile goes in, the
 * engine scores it, an ordered list comes out, an application is made and moved.
 *
 *   pnpm db:up && pnpm db:migrate && pnpm db:seed
 *   pnpm smoke
 *
 * With a server running it also checks the HTTP surface, which is the part the
 * delivery video has to show returning JSON:
 *
 *   pnpm smoke http://localhost:3000/api
 *
 * Exits non-zero on the first failed check, so CI and a human read it the same way.
 */
import {
  createApplication,
  deleteApplication,
  deleteProfile,
  getProfile,
  listApplications,
  listVacancies,
  pool,
  saveProfile,
  updateApplicationStatus,
} from "@moonlight/db";
import {
  applicationCards,
  canMove,
  groupByStatus,
  marketGaps,
  profileCompleteness,
  rankVacancies,
} from "@moonlight/core";

const PROFILE_ID = "smoke-candidate";
let failures = 0;

function check(label: string, passed: boolean, detail = ""): void {
  console.log(`${passed ? "  ok  " : " FAIL "} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!passed) failures += 1;
}

// --- input: a half-filled candidate, the exact problem the brief describes ---

const draft = {
  id: PROFILE_ID,
  email: "smoke@example.com",
  fullName: "Smoke Candidate",
  skills: [{ name: "TypeScript" }, { name: "React" }],
  experience: [],
  education: [],
  expectations: { workModes: [], willRelocate: false, cities: [] },
};

await saveProfile(draft);
const stored = await getProfile(PROFILE_ID);
check("the profile survives a round trip", stored?.email === draft.email);
if (!stored) {
  await pool.end();
  process.exit(1);
}

// --- process: completeness, ranking and gaps ---

const before = profileCompleteness(stored);
check("an incomplete profile scores under 100", before.percentage < 100, `${before.percentage}%`);
check("it names what is missing", before.missing.length > 0, before.missing.join(", "));

const vacancies = await listVacancies();
check("the vacancy dataset is seeded", vacancies.length >= 20, `${vacancies.length} vacancies`);

const ranked = rankVacancies(stored, vacancies);
check("every vacancy comes back scored", ranked.length === vacancies.length);
check(
  "the list is ordered best first",
  ranked.every((r, i) => i === 0 || (ranked[i - 1]?.score ?? 100) >= r.score),
  ranked
    .slice(0, 3)
    .map((r) => `${r.vacancyId}:${r.score}`)
    .join(" "),
);
check("the top match explains itself", (ranked[0]?.reason.length ?? 0) > 0, ranked[0]?.reason);

const gaps = marketGaps(stored, vacancies);
check(
  "gaps are measured across the whole market",
  gaps.length > 0 && (gaps[0]?.demandCount ?? 0) > 1,
  gaps[0] ? `${gaps[0].skill} in ${gaps[0].demandCount} vacancies` : "",
);

// --- output: completing the profile raises the number ---

const completed = {
  ...stored,
  city: "Medellín",
  education: [{ institution: "EAFIT", degree: "Ing.", startYear: 2020 }],
  experience: [{ company: "ACME", title: "Dev", startDate: "2024-01" }],
  expectations: {
    targetRole: "Full Stack Developer",
    salaryMin: 7_000_000,
    salaryMax: 11_000_000,
    currency: "COP",
    workModes: ["remote" as const],
    willRelocate: false,
    cities: [],
  },
};
await saveProfile(completed);
const after = profileCompleteness(completed);
check("filling the gaps reaches 100%", after.percentage === 100, `${before.percentage}% → 100%`);

// --- the pipeline ---

const target = ranked[0]?.vacancyId ?? vacancies[0]?.id ?? "";
const application = await createApplication(PROFILE_ID, target);
check("applying records one row", application.status === "applied", `${target}`);

const twice = await createApplication(PROFILE_ID, target);
check("applying twice is the same application", twice.id === application.id);

check("the machine refuses an illegal move", !canMove("applied", "interview"));
const moved = await updateApplicationStatus(application.id, "in-review");
check("a legal move sticks", moved?.status === "in-review");

const cards = applicationCards(completed, await listApplications(PROFILE_ID), vacancies);
check("the board carries the same score as the list", cards[0]?.score === ranked[0]?.score);
check("the board always has four columns", groupByStatus(cards).length === 4);

await deleteApplication(application.id);
await deleteProfile(PROFILE_ID);

// --- optional: the HTTP surface ---

const base = process.argv[2];
if (base) {
  const json = async (path: string): Promise<{ status: number; body: unknown }> => {
    const response = await fetch(`${base}${path}`);
    return { status: response.status, body: await response.json() };
  };

  const health = await json("/health");
  check("GET /health answers", health.status === 200, JSON.stringify(health.body));

  const list = await json("/vacancies");
  check(
    "GET /vacancies returns the dataset",
    list.status === 200 && Array.isArray(list.body) && list.body.length >= 20,
  );

  const recommendations = await json("/profiles/demo-candidate/recommendations");
  const payload = recommendations.body as { recommendations?: unknown[] };
  check(
    "GET /profiles/:id/recommendations returns a ranking",
    recommendations.status === 200 && (payload.recommendations?.length ?? 0) > 0,
    `${payload.recommendations?.length ?? 0} scored`,
  );

  const missing = await json("/vacancies/does-not-exist");
  check("a missing vacancy is a 404, not a crash", missing.status === 404);
} else {
  console.log("  ..   HTTP checks skipped — pass a base URL to run them");
}

await pool.end();
console.log(failures === 0 ? "\nflow ok" : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
