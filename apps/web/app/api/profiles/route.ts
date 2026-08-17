import type { Profile } from "@moonlight/types";
import { saveProfile } from "@moonlight/db";
import { profileCompleteness } from "@moonlight/core";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const profile = (await request.json()) as Profile;
  if (!profile?.id || !profile.email) {
    return Response.json({ error: "id and email are required" }, { status: 400 });
  }
  const saved = await saveProfile(profile);
  return Response.json(
    { profile: saved, completeness: profileCompleteness(saved) },
    { status: 201 },
  );
}
