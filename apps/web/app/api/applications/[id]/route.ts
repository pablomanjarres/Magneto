import {
  deleteApplication,
  getApplication,
  updateApplicationNote,
  updateApplicationStatus,
} from "@moonlight/db";
import type { Application, ApplicationEventKind } from "@moonlight/types";
import { ALLOWED_MOVES, canMove, isApplicationStatus, parseNote } from "@moonlight/core";

import { publish } from "../../../../lib/events";
import { withRequestLog } from "../../../../lib/log";

export const dynamic = "force-dynamic";

const record = (application: Application, kind: ApplicationEventKind, detail?: string) =>
  publish({
    profileId: application.profileId,
    vacancyId: application.vacancyId,
    applicationId: application.id,
    kind,
    detail,
  });

/**
 * PATCH /api/applications/:id — move one application to another column with
 * `{ status }`, or write its next step with `{ note }`.
 */
export const PATCH = withRequestLog(
  "PATCH /api/applications/[id]",
  async (request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> => {
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
      await record(application, "note");
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

    const application = await updateApplicationStatus(id, body.status);
    if (!application) return Response.json({ error: "application not found" }, { status: 404 });
    await record(application, "moved", `${current.status}→${application.status}`);
    return Response.json({ application });
  },
);

/** DELETE /api/applications/:id — withdraw. Nothing was sent anywhere anyway. */
export const DELETE = withRequestLog(
  "DELETE /api/applications/[id]",
  async (_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> => {
    const { id } = await params;
    // Read first: once the row is gone, the log could not say which vacancy it was.
    const current = await getApplication(id);
    if (!current || !(await deleteApplication(id))) {
      return Response.json({ error: "application not found" }, { status: 404 });
    }
    await record(current, "withdrawn");
    return new Response(null, { status: 204 });
  },
);
