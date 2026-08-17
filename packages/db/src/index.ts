import { readFileSync } from "node:fs";
import { Pool } from "pg";
import type { Profile, Vacancy } from "@moonlight/types";

const connectionString =
  process.env["DATABASE_URL"] ?? "postgresql://moonlight:moonlight@localhost:5433/moonlight";

export const pool = new Pool({ connectionString });

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

/** Every vacancy with its requirements folded in, in one round trip. */
export async function listVacancies(): Promise<Vacancy[]> {
  const { rows } = await pool.query<VacancyRow>(`
    SELECT v.*,
           COALESCE(
             json_agg(json_build_object('skill', r.skill, 'kind', r.kind))
               FILTER (WHERE r.skill IS NOT NULL),
             '[]'
           ) AS requirements
    FROM vacancies v
    LEFT JOIN vacancy_requirements r ON r.vacancy_id = v.id
    GROUP BY v.id
    ORDER BY v.id
  `);

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    company: r.company,
    city: r.city,
    workMode: r.work_mode,
    salaryMin: r.salary_min ?? undefined,
    salaryMax: r.salary_max ?? undefined,
    currency: r.currency ?? undefined,
    requirements: r.requirements ?? [],
  }));
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  await pool.query(
    `INSERT INTO profiles (id, email, full_name, city, skills, experience, education, expectations)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email, full_name = EXCLUDED.full_name, city = EXCLUDED.city,
       skills = EXCLUDED.skills, experience = EXCLUDED.experience,
       education = EXCLUDED.education, expectations = EXCLUDED.expectations`,
    [
      profile.id,
      profile.email,
      profile.fullName,
      profile.city ?? null,
      JSON.stringify(profile.skills),
      JSON.stringify(profile.experience),
      JSON.stringify(profile.education),
      JSON.stringify(profile.expectations),
    ],
  );
  return profile;
}

interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  city: string | null;
  skills: Profile["skills"];
  experience: Profile["experience"];
  education: Profile["education"];
  expectations: Profile["expectations"];
}

export async function getProfile(id: string): Promise<Profile | null> {
  const { rows } = await pool.query<ProfileRow>("SELECT * FROM profiles WHERE id = $1", [id]);
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    city: r.city ?? undefined,
    skills: r.skills,
    experience: r.experience,
    education: r.education,
    expectations: r.expectations,
  };
}

export const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;
