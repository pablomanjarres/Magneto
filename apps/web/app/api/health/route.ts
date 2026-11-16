import { withRequestLog } from "../../../lib/log";

export const dynamic = "force-dynamic";

export const GET = withRequestLog("GET /api/health", async (): Promise<Response> => {
  return Response.json({ status: "ok", service: "next" });
});
