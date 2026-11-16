import { NextResponse } from "next/server";
import { z } from "zod";
import { getProfile } from "@moonlight/db";

import { withRequestLog } from "../../../lib/log";
import { PROFILE_COOKIE } from "../../../lib/queries";

export const dynamic = "force-dynamic";

const Body = z.object({ profileId: z.string().trim().min(1).max(200) });

/**
 * POST /api/session — the profile the app acts as from now on. There is no
 * sign-in, so this proves nothing about who is asking: it only remembers a
 * choice, in a cookie the page's scripts cannot read.
 */
export const POST = withRequestLog("POST /api/session", async (request: Request) => {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "body is not valid JSON" }, { status: 400 });
  }
  const body = Body.safeParse(json);
  if (!body.success) return Response.json({ error: "profileId is required" }, { status: 400 });

  const profile = await getProfile(body.data.profileId);
  if (!profile) return Response.json({ error: "profile not found" }, { status: 404 });

  const response = NextResponse.json({ profileId: profile.id });
  response.cookies.set(PROFILE_COOKIE, profile.id, { httpOnly: true, sameSite: "lax", path: "/" });
  return response;
});
