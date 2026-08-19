import { randomUUID } from "node:crypto";
import { saveProfile } from "@moonlight/db";
import { parseProfile } from "@moonlight/core";

import { CANDIDATE_COOKIE } from "../../../lib/queries";

export const dynamic = "force-dynamic";

/**
 * Register a candidate: a name and an email in, an empty profile out. Sprint 1
 * imports nothing from LinkedIn, so this is the only way a profile starts and
 * the wizard is what fills it.
 *
 * The response remembers the new profile in a cookie. That is not a login —
 * there is no password to check — it is only how the next page knows whose
 * profile to show.
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "body is not valid JSON" }, { status: 400 });
  }

  const { fullName, email } = (body ?? {}) as { fullName?: string; email?: string };
  const parsed = parseProfile({ id: randomUUID(), fullName, email, expectations: {} });
  if ("errors" in parsed) {
    return Response.json({ error: parsed.errors.join(", ") }, { status: 400 });
  }

  try {
    const profile = await saveProfile(parsed.profile);
    const response = Response.json({ profile }, { status: 201 });
    response.headers.set(
      "set-cookie",
      `${CANDIDATE_COOKIE}=${profile.id}; Path=/; Max-Age=604800; SameSite=Lax; HttpOnly`,
    );
    return response;
  } catch (cause) {
    // profiles.email is UNIQUE, so the same address twice is the caller's
    // mistake rather than ours.
    if ((cause as { code?: string }).code === "23505") {
      return Response.json({ error: "that email is already registered" }, { status: 409 });
    }
    throw cause;
  }
}
