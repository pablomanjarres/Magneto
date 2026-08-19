import {
  createApplication,
  getProfile,
  getVacancy,
  listApplications,
  listVacancies,
} from "@moonlight/db";
import { applicationCards } from "@moonlight/core";

export const dynamic = "force-dynamic";

/** GET /api/applications?profileId=demo-candidate — the board, scored. */
export async function GET(request: Request): Promise<Response> {
  const profileId = new URL(request.url).searchParams.get("profileId");
  if (!profileId) return Response.json({ error: "profileId is required" }, { status: 400 });

  const profile = await getProfile(profileId);
  if (!profile) return Response.json({ error: "profile not found" }, { status: 404 });

  const [applications, vacancies] = await Promise.all([
    listApplications(profileId),
    listVacancies(),
  ]);
  return Response.json({ applications: applicationCards(profile, applications, vacancies) });
}

/** POST /api/applications — apply to one vacancy. Applying twice is one row. */
export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as { profileId?: string; vacancyId?: string; note?: string };
  if (!body?.profileId || !body.vacancyId) {
    return Response.json({ error: "profileId and vacancyId are required" }, { status: 400 });
  }

  const [profile, vacancy] = await Promise.all([
    getProfile(body.profileId),
    getVacancy(body.vacancyId),
  ]);
  if (!profile) return Response.json({ error: "profile not found" }, { status: 404 });
  if (!vacancy) return Response.json({ error: "vacancy not found" }, { status: 404 });

  const application = await createApplication(body.profileId, body.vacancyId, body.note);
  return Response.json({ application }, { status: 201 });
}
