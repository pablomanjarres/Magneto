import { authenticate, createSession } from "@moonlight/db";

import { sessionCookie } from "../../../../lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "body is not valid JSON" }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as { email?: string; password?: string };
  if (!email || !password) {
    return Response.json({ error: "email and password are required" }, { status: 400 });
  }

  const profile = await authenticate(email, password);
  // One message for both a wrong password and an unknown email: saying which
  // would tell a stranger whose email is registered here.
  if (!profile) {
    return Response.json({ error: "email or password is wrong" }, { status: 401 });
  }

  const response = Response.json({ profile });
  response.headers.append("set-cookie", sessionCookie(await createSession(profile.id)));
  return response;
}
