import { getProfile } from "@moonlight/db";
import { profileCompleteness } from "@moonlight/core";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) return Response.json({ error: "profile not found" }, { status: 404 });
  return Response.json({ profile, completeness: profileCompleteness(profile) });
}
