import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteProfile, getProfile } from "@moonlight/db";
import { profileCompleteness } from "@moonlight/core";
import { withRequestLog } from "../../../../lib/log";
import { isSampleProfile, PROFILE_COOKIE } from "../../../../lib/queries";

export const dynamic = "force-dynamic";

export const GET = withRequestLog(
  "GET /api/profiles/[id]",
  async (_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> => {
    const { id } = await params;
    const profile = await getProfile(id);
    if (!profile) return Response.json({ error: "profile not found" }, { status: 404 });
    return Response.json({ profile, completeness: profileCompleteness(profile) });
  },
);

/**
 * DELETE /api/profiles/:id — removes a profile with its applications. The
 * sample profiles stay: the demo opens on them. When the deleted profile was
 * the one picked, its cookie goes too, so the next page falls back to the sample.
 */
export const DELETE = withRequestLog(
  "DELETE /api/profiles/[id]",
  async (_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> => {
    const { id } = await params;
    if (isSampleProfile(id)) {
      return Response.json({ error: "sample profiles cannot be deleted" }, { status: 403 });
    }
    if (!(await deleteProfile(id))) {
      return Response.json({ error: "profile not found" }, { status: 404 });
    }
    const response = new NextResponse(null, { status: 204 });
    if ((await cookies()).get(PROFILE_COOKIE)?.value === id)
      response.cookies.delete(PROFILE_COOKIE);
    return response;
  },
);
