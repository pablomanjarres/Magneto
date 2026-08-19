import { deleteApplication, getApplication, updateApplicationStatus } from "@moonlight/db";
import { ALLOWED_MOVES, canMove, isApplicationStatus } from "@moonlight/core";

export const dynamic = "force-dynamic";

/** PATCH /api/applications/:id — move one application to another column. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const body = (await request.json()) as { status?: unknown };

  if (!isApplicationStatus(body?.status)) {
    return Response.json(
      { error: "status must be one of the four board columns" },
      { status: 400 },
    );
  }

  const current = await getApplication(id);
  if (!current) return Response.json({ error: "application not found" }, { status: 404 });

  if (!canMove(current.status, body.status)) {
    return Response.json(
      {
        error: `cannot move from ${current.status} to ${body.status}`,
        allowed: ALLOWED_MOVES[current.status],
      },
      { status: 409 },
    );
  }

  return Response.json({ application: await updateApplicationStatus(id, body.status) });
}

/** DELETE /api/applications/:id — withdraw. Nothing was sent anywhere anyway. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const removed = await deleteApplication(id);
  if (!removed) return Response.json({ error: "application not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
