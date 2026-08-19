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
    return Response.json(
      { error: parsed.errors.join(", "), errors: parsed.errors },
      { status: 400 },
    );
  }

  // profiles.email is UNIQUE but the upsert only absorbs a conflict on the id,
  // so a known email under a new id raises 23505. That is the caller's mistake,
  // not ours: answer 409 rather than letting it surface as a 500.
  try {
    const saved = await saveProfile(parsed.profile);
    return Response.json(
      { profile: saved, completeness: profileCompleteness(saved) },
      { status: 201 },
    );
  } catch (cause) {
    if ((cause as { code?: string }).code === "23505") {
      return Response.json(
        { error: "that email already belongs to another profile" },
        { status: 409 },
      );
    }
    throw cause;
  }
}
