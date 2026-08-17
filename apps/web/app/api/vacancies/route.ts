import { listVacancies } from "@moonlight/db";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return Response.json(await listVacancies());
}
