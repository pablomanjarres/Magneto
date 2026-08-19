import { randomUUID } from "node:crypto";
import { createSession, emailTaken, registerProfile } from "@moonlight/db";
import { blankProfile, parseRegistration, profileCompleteness } from "@moonlight/core";

import { sessionCookie } from "../../../../lib/session";

export const dynamic = "force-dynamic";

/**
 * Create an account. Delivery 1 imports nothing from LinkedIn, so a new
 * candidate lands here with an empty profile and fills it in the wizard.
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "body is not valid JSON" }, { status: 400 });
  }

  const parsed = parseRegistration(body);
  if ("errors" in parsed) {
    return Response.json(
      { error: parsed.errors.join(", "), errors: parsed.errors },
      { status: 400 },
    );
  }

  if (await emailTaken(parsed.registration.email)) {
    return Response.json({ error: "that email already has an account" }, { status: 409 });
  }

  const profile = await registerProfile(
    blankProfile(randomUUID(), parsed.registration),
    parsed.registration.password,
  );

  const response = Response.json(
    { profile, completeness: profileCompleteness(profile) },
    { status: 201 },
  );
  response.headers.append("set-cookie", sessionCookie(await createSession(profile.id)));
  return response;
}
