import type { Profile } from "@moonlight/types";

import { pool } from "../pool.js";

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string;
  city: string | null;
  skills: Profile["skills"];
  experience: Profile["experience"];
  education: Profile["education"];
  expectations: Profile["expectations"];
  headline: string | null;
  summary: string | null;
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  await pool.query(
    `INSERT INTO profiles (id, email, full_name, city, skills, experience, education, expectations, headline, summary)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email, full_name = EXCLUDED.full_name, city = EXCLUDED.city,
       skills = EXCLUDED.skills, experience = EXCLUDED.experience,
       education = EXCLUDED.education, expectations = EXCLUDED.expectations,
       headline = EXCLUDED.headline, summary = EXCLUDED.summary`,
    [
      profile.id,
      // No e-mail yet is NULL: UNIQUE allows many NULLs, but only one empty string.
      profile.email || null,
      profile.fullName,
      profile.city ?? null,
      JSON.stringify(profile.skills),
      JSON.stringify(profile.experience),
      JSON.stringify(profile.education),
      JSON.stringify(profile.expectations),
      profile.headline ?? null,
      profile.summary ?? null,
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
    email: r.email ?? "",
    fullName: r.full_name,
    city: r.city ?? undefined,
    skills: r.skills,
    experience: r.experience,
    education: r.education,
    expectations: r.expectations,
    headline: r.headline ?? undefined,
    summary: r.summary ?? undefined,
  };
}

/** Who a profile is, in one line: enough to list it, nothing more. */
export interface ProfileSummary {
  id: string;
  fullName: string;
  targetRole?: string | undefined;
}

/** Every profile, oldest first, up to `limit`: a list on screen has to fit. */
export async function listProfiles(limit = 50): Promise<ProfileSummary[]> {
  const { rows } = await pool.query<{ id: string; full_name: string; target_role: string | null }>(
    `SELECT id, full_name, expectations ->> 'targetRole' AS target_role
       FROM profiles ORDER BY created_at, id LIMIT $1`,
    [limit],
  );
  return rows.map((r) => ({
    id: r.id,
    fullName: r.full_name,
    targetRole: r.target_role ?? undefined,
  }));
}
