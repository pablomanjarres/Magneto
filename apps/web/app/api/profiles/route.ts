import { saveProfile } from "@moonlight/db";
import { parseProfile, profileCompleteness } from "@moonlight/core";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "body is not valid JSON" }, { status: 400 });
  }

  const parsed = parseProfile(body);
  if ("errors" in parsed) {
    return Response.json({ error: parsed.errors.join(", "), errors: parsed.errors }, { status: 400 });
  }

  const saved = await saveProfile(parsed.profile);
  return Response.json(
    { profile: saved, completeness: profileCompleteness(saved) },
    { status: 201 },
  );
}
