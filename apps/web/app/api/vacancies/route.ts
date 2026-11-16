import { listVacancies } from "@moonlight/db";
import { withRequestLog } from "../../../lib/log";

export const dynamic = "force-dynamic";

export const GET = withRequestLog("GET /api/vacancies", async (): Promise<Response> => {
  return Response.json(await listVacancies());
});
