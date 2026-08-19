import { getVacancy } from "@moonlight/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const vacancy = await getVacancy(id);
  if (!vacancy) return Response.json({ error: "vacancy not found" }, { status: 404 });
  return Response.json(vacancy);
}
