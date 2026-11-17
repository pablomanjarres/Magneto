import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Profile } from "@moonlight/types";
import { emptyProfile, isEmptyProfile } from "@moonlight/core";
import { getProfile, listProfiles, saveProfile } from "@moonlight/db";

import { withRequestLog } from "../../../lib/log";
import { PROFILE_COOKIE } from "../../../lib/queries";

export const dynamic = "force-dynamic";

const Body = z.union([
  z.object({ profileId: z.string().trim().min(1).max(200) }),
  // "Crear perfil nuevo": an empty profile, stored so every screen can show it.
  z.object({ blank: z.literal(true) }),
]);

/** One nobody has filled in yet, so repeated clicks do not pile up blanks, or else a new one. */
async function blankProfile(): Promise<Profile> {
  for (const { id, fullName } of await listProfiles()) {
    const held = fullName ? null : await getProfile(id);
    if (held && isEmptyProfile(held)) return held;
  }
  return saveProfile(emptyProfile(randomUUID()));
}

/**
 * POST /api/session — the profile the app acts as from now on: one picked by
 * id, or an empty one with `blank: true`. There is no sign-in, so this proves
 * nothing about who is asking: it only remembers a choice, in a cookie the
 * page's scripts cannot read.
 */
export const POST = withRequestLog("POST /api/session", async (request: Request) => {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "body is not valid JSON" }, { status: 400 });
  }
  const body = Body.safeParse(json);
  if (!body.success) {
    return Response.json({ error: "profileId or blank: true is required" }, { status: 400 });
  }

  const profile =
    "blank" in body.data ? await blankProfile() : await getProfile(body.data.profileId);
  if (!profile) return Response.json({ error: "profile not found" }, { status: 404 });

  const response = NextResponse.json({ profileId: profile.id });
  response.cookies.set(PROFILE_COOKIE, profile.id, { httpOnly: true, sameSite: "lax", path: "/" });
  return response;
});
