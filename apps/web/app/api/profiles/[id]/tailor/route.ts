import { getProfile, getVacancy } from "@moonlight/db";
import { checkTailored, comparisonBlockers } from "@moonlight/core";

import { withRequestLog } from "../../../../../lib/log";
import { rateLimit } from "../../../../../lib/rate-limit";
import { TailorError, tailorProfile } from "../../../../../lib/tailor";

export const dynamic = "force-dynamic";

/** POST /api/profiles/:id/tailor — the profile rewritten for one vacancy, checked for invented facts. */
export const POST = withRequestLog(
  "POST /api/profiles/[id]/tailor",
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const limited = rateLimit(request, "tailor", 10, 60 * 60 * 1000);
    if (limited) return limited;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "body is not valid JSON" }, { status: 400 });
    }
    const vacancyId = (body as { vacancyId?: unknown } | null)?.vacancyId;
    if (typeof vacancyId !== "string" || vacancyId === "") {
      return Response.json({ error: "vacancyId is required" }, { status: 400 });
    }

    const { id } = await params;
    const [profile, vacancy] = await Promise.all([getProfile(id), getVacancy(vacancyId)]);
    if (!profile) return Response.json({ error: "profile not found" }, { status: 404 });
    if (!vacancy) return Response.json({ error: "vacancy not found" }, { status: 404 });
    if (comparisonBlockers(profile).length > 0) {
      return Response.json({ error: "Completa tu perfil primero" }, { status: 400 });
    }

    try {
      const tailored = await tailorProfile(profile, vacancy);
      return Response.json({ tailored, check: checkTailored(profile, tailored) });
    } catch (cause) {
      if (cause instanceof TailorError) {
        return Response.json({ error: cause.message, problems: cause.problems }, { status: 422 });
      }
      throw cause;
    }
  },
);
