import type { Profile } from "@moonlight/types";

import { pool } from "../pool.js";

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
