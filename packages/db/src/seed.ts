import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { Vacancy } from "@moonlight/types";

import { pool, readJson } from "./index.js";

const here = dirname(fileURLToPath(import.meta.url));
const vacancies = readJson<Vacancy[]>(
  join(here, "..", "..", "..", "data", "jobs", "vacancies.json"),
);

// Re-runnable on purpose: seeding twice must not duplicate a vacancy.
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

const { rows } = await pool.query<{ count: string }>("SELECT count(*) FROM vacancies");
console.log(`seeded ${vacancies.length} vacancies, table now holds ${rows[0]?.count ?? "0"}`);
await pool.end();
