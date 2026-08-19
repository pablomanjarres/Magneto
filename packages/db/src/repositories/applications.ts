import type { Application, ApplicationStatus } from "@moonlight/types";

import { pool } from "../pool.js";

interface ApplicationRow {
  id: string;
  profile_id: string;
  vacancy_id: string;
  status: ApplicationStatus;
  applied_at: Date;
  updated_at: Date;
  note: string | null;
}

const toApplication = (r: ApplicationRow): Application => ({
  id: r.id,
  profileId: r.profile_id,
  vacancyId: r.vacancy_id,
  status: r.status,
  appliedAt: r.applied_at.toISOString(),
  updatedAt: r.updated_at.toISOString(),
  note: r.note ?? undefined,
});

export async function listApplications(profileId: string): Promise<Application[]> {
  const { rows } = await pool.query<ApplicationRow>(
    "SELECT * FROM applications WHERE profile_id = $1 ORDER BY applied_at DESC, id",
    [profileId],
  );
  return rows.map(toApplication);
}

export async function getApplication(id: string): Promise<Application | null> {
  const { rows } = await pool.query<ApplicationRow>("SELECT * FROM applications WHERE id = $1", [
    id,
  ]);
  const row = rows[0];
  return row ? toApplication(row) : null;
}

/**
 * Applying twice to the same vacancy is the same application, so the pair is
 * the key and a repeat is a no-op that returns what is already there.
 */
export async function createApplication(
  profileId: string,
  vacancyId: string,
  note?: string,
): Promise<Application> {
  const { rows } = await pool.query<ApplicationRow>(
    `INSERT INTO applications (profile_id, vacancy_id, note)
     VALUES ($1, $2, $3)
     ON CONFLICT (profile_id, vacancy_id) DO UPDATE SET profile_id = EXCLUDED.profile_id
     RETURNING *`,
    [profileId, vacancyId, note ?? null],
  );
  return toApplication(rows[0] as ApplicationRow);
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
): Promise<Application | null> {
  const { rows } = await pool.query<ApplicationRow>(
    "UPDATE applications SET status = $2, updated_at = now() WHERE id = $1 RETURNING *",
    [id, status],
  );
  const row = rows[0];
  return row ? toApplication(row) : null;
}

export async function deleteApplication(id: string): Promise<boolean> {
  const { rowCount } = await pool.query("DELETE FROM applications WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}
