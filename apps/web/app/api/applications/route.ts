import {
  createApplication,
  getProfile,
  getVacancy,
  listApplications,
  listVacancies,
} from "@moonlight/db";
import { applicationCards, parseNote } from "@moonlight/core";

import { publish } from "../../../lib/events";
import { withRequestLog } from "../../../lib/log";

export const dynamic = "force-dynamic";

/** GET /api/applications?profileId=demo-candidate — the board, scored. */
export const GET = withRequestLog(
  "GET /api/applications",
  async (request: Request): Promise<Response> => {
    const profileId = new URL(request.url).searchParams.get("profileId");
    if (!profileId) return Response.json({ error: "profileId is required" }, { status: 400 });

    const profile = await getProfile(profileId);
    if (!profile) return Response.json({ error: "profile not found" }, { status: 404 });

    const [applications, vacancies] = await Promise.all([
      listApplications(profileId),
      listVacancies(),
    ]);
    return Response.json({ applications: applicationCards(profile, applications, vacancies) });
  },
);

/** POST /api/applications — apply to one vacancy. Applying twice is one row. */
export const POST = withRequestLog(
  "POST /api/applications",
  async (request: Request): Promise<Response> => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "body is not valid JSON" }, { status: 400 });
    }

    // Every field is checked here, before any query: ids must be text, and the
    // note goes through the same rule as the board's next-step form.
    const { profileId, vacancyId, note } = (body ?? {}) as Record<string, unknown>;
    if (
      typeof profileId !== "string" ||
      typeof vacancyId !== "string" ||
      !profileId ||
      !vacancyId
    ) {
      return Response.json({ error: "profileId and vacancyId must be text" }, { status: 400 });
    }
    const parsedNote = note === undefined ? { note: null } : parseNote(note);
    if ("error" in parsedNote) return Response.json({ error: parsedNote.error }, { status: 400 });

    const [profile, vacancy] = await Promise.all([getProfile(profileId), getVacancy(vacancyId)]);
    if (!profile) return Response.json({ error: "profile not found" }, { status: 404 });
    if (!vacancy) return Response.json({ error: "vacancy not found" }, { status: 404 });

    const application = await createApplication(profileId, vacancyId, parsedNote.note ?? undefined);
    await publish({
      profileId: application.profileId,
      vacancyId: application.vacancyId,
      applicationId: application.id,
      kind: "applied",
    });
    return Response.json({ application }, { status: 201 });
  },
);
