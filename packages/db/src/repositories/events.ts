import type { ApplicationEvent, ApplicationEventKind } from "@moonlight/types";

import { pool } from "../pool.js";

interface EventRow {
  id: string;
  profile_id: string;
  vacancy_id: string;
  application_id: string;
  kind: ApplicationEventKind;
  detail: string | null;
  created_at: Date;
}

const toEvent = (r: EventRow): ApplicationEvent => ({
  id: r.id,
  profileId: r.profile_id,
  vacancyId: r.vacancy_id,
  applicationId: r.application_id,
  kind: r.kind,
  detail: r.detail ?? undefined,
  createdAt: r.created_at.toISOString(),
});

/** Stores the event as published, so its id and time match what listeners saw. */
export async function recordEvent(event: ApplicationEvent): Promise<ApplicationEvent> {
  const { rows } = await pool.query<EventRow>(
    `INSERT INTO application_events
       (id, profile_id, vacancy_id, application_id, kind, detail, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      event.id,
      event.profileId,
      event.vacancyId,
      event.applicationId,
      event.kind,
      event.detail ?? null,
      event.createdAt,
    ],
  );
  return toEvent(rows[0] as EventRow);
}

/** Newest first. `limit` keeps the log a rail, not a dump. */
export async function listEvents(profileId: string, limit: number): Promise<ApplicationEvent[]> {
  const { rows } = await pool.query<EventRow>(
    `SELECT * FROM application_events WHERE profile_id = $1
     ORDER BY created_at DESC, id LIMIT $2`,
    [profileId, limit],
  );
  return rows.map(toEvent);
}
