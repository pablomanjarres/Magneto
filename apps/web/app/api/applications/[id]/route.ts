import {
  deleteApplication,
  getApplication,
  updateApplicationNote,
  updateApplicationStatus,
} from "@moonlight/db";
import { ALLOWED_MOVES, canMove, isApplicationStatus, parseNote } from "@moonlight/core";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/applications/:id — move one application to another column with
 * `{ status }`, or write its next step with `{ note }`.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  let body: { status?: unknown; note?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "body is not valid JSON" }, { status: 400 });
  }

  if (body !== null && typeof body === "object" && "note" in body) {
    const parsed = parseNote(body.note);
    if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });
    const application = await updateApplicationNote(id, parsed.note);
    if (!application) return Response.json({ error: "application not found" }, { status: 404 });
    return Response.json({ application });
  }

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
