import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { Application, Profile, Vacancy } from "@moonlight/types";

import { pool, readJson } from "./index.js";
import { saveProfile } from "./repositories/profiles.js";

const data = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "data");
const vacancies = readJson<Vacancy[]>(join(data, "jobs", "vacancies.json"));
const candidate = readJson<Profile>(join(data, "sample-profiles", "candidate.json"));

/**
 * The demo pipeline. Fixed ids and fixed vacancies so the board looks the same
 * on every machine, which is what the delivery video needs.
 */
const applications: ReadonlyArray<Pick<Application, "id" | "vacancyId" | "status">> = [
  { id: "a001", vacancyId: "v003", status: "interview" },
  { id: "a002", vacancyId: "v001", status: "in-review" },
  { id: "a003", vacancyId: "v013", status: "in-review" },
  { id: "a004", vacancyId: "v010", status: "applied" },
  { id: "a005", vacancyId: "v014", status: "applied" },
  { id: "a006", vacancyId: "v006", status: "rejected" },
];

// Re-runnable on purpose: seeding twice must not duplicate anything.
for (const v of vacancies) {
  await pool.query(
    `INSERT INTO vacancies (id, title, company, city, work_mode, salary_min, salary_max, currency)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO NOTHING`,
    [
      v.id,
      v.title,
      v.company,
      v.city,
      v.workMode,
      v.salaryMin ?? null,
      v.salaryMax ?? null,
      v.currency ?? null,
    ],
  );
  for (const r of v.requirements) {
    await pool.query(
      `INSERT INTO vacancy_requirements (vacancy_id, skill, kind) VALUES ($1, $2, $3)
       ON CONFLICT (vacancy_id, skill) DO NOTHING`,
      [v.id, r.skill, r.kind],
    );
  }
}

await saveProfile(candidate);

for (const a of applications) {
  await pool.query(
    `INSERT INTO applications (id, profile_id, vacancy_id, status) VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO NOTHING`,
    [a.id, candidate.id, a.vacancyId, a.status],
  );
}

const { rows } = await pool.query<{ vacancies: string; applications: string }>(
  `SELECT (SELECT count(*) FROM vacancies)    AS vacancies,
          (SELECT count(*) FROM applications) AS applications`,
);
console.log(
  `seeded ${vacancies.length} vacancies and profile ${candidate.id}; ` +
    `tables now hold ${rows[0]?.vacancies ?? "0"} vacancies and ` +
    `${rows[0]?.applications ?? "0"} applications`,
);
await pool.end();
