import type { Vacancy } from "@moonlight/types";

import { pool } from "../pool.js";

interface VacancyRow {
  id: string;
  title: string;
  company: string;
  city: string;
  work_mode: Vacancy["workMode"];
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  requirements: Vacancy["requirements"] | null;
}

/** One vacancy with its requirements folded in. Shared by both queries below. */
const SELECT_VACANCIES = `
  SELECT v.*,
         COALESCE(
           json_agg(json_build_object('skill', r.skill, 'kind', r.kind))
             FILTER (WHERE r.skill IS NOT NULL),
           '[]'
         ) AS requirements
  FROM vacancies v
  LEFT JOIN vacancy_requirements r ON r.vacancy_id = v.id
`;

const toVacancy = (r: VacancyRow): Vacancy => ({
  id: r.id,
  title: r.title,
  company: r.company,
  city: r.city,
  workMode: r.work_mode,
  salaryMin: r.salary_min ?? undefined,
  salaryMax: r.salary_max ?? undefined,
  currency: r.currency ?? undefined,
  requirements: r.requirements ?? [],
});

export async function listVacancies(): Promise<Vacancy[]> {
  const { rows } = await pool.query<VacancyRow>(
    `${SELECT_VACANCIES} GROUP BY v.id ORDER BY v.id`,
  );
  return rows.map(toVacancy);
}

export async function getVacancy(id: string): Promise<Vacancy | null> {
  const { rows } = await pool.query<VacancyRow>(
    `${SELECT_VACANCIES} WHERE v.id = $1 GROUP BY v.id`,
    [id],
  );
  const row = rows[0];
  return row ? toVacancy(row) : null;
}
