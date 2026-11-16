import { getProfile, listVacancies } from "@moonlight/db";
import { marketGaps, profileCompleteness, rankVacancies } from "@moonlight/core";
import { withRequestLog } from "../../../../../lib/log";

export const dynamic = "force-dynamic";

export const GET = withRequestLog(
  "GET /api/profiles/[id]/recommendations",
  async (_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> => {
    const { id } = await params;
    const profile = await getProfile(id);
    if (!profile) return Response.json({ error: "profile not found" }, { status: 404 });

    const vacancies = await listVacancies();
    return Response.json({
      completeness: profileCompleteness(profile),
      recommendations: rankVacancies(profile, vacancies),
      marketGaps: marketGaps(profile, vacancies),
    });
  },
);
