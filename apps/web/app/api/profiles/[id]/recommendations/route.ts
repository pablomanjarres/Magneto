import { getProfile, listVacancies } from "@moonlight/db";
import { marketGaps, profileCompleteness, rankVacancies } from "@moonlight/core";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) return Response.json({ error: "profile not found" }, { status: 404 });

  const vacancies = await listVacancies();
  return Response.json({
    completeness: profileCompleteness(profile),
    recommendations: rankVacancies(profile, vacancies),
    marketGaps: marketGaps(profile, vacancies),
  });
}
