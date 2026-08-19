import { deleteSession } from "@moonlight/db";

import { clearedSessionCookie, currentToken } from "../../../../lib/session";

export const dynamic = "force-dynamic";

/** Signing out drops the session row too, so the token is dead server side. */
export async function POST(): Promise<Response> {
  const token = await currentToken();
  if (token) await deleteSession(token);

  const response = new Response(null, { status: 204 });
  response.headers.append("set-cookie", clearedSessionCookie());
  return response;
}
