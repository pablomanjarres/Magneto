import { z } from "zod";

import { answer } from "../../../lib/assistant";
import { UserFacingError } from "../../../lib/errors";
import { withRequestLog } from "../../../lib/log";
import { requireProfile } from "../../../lib/queries";
import { rateLimit } from "../../../lib/rate-limit";
import { Draft } from "../../../lib/tailor";

export const dynamic = "force-dynamic";

const Body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20)
    .refine((list) => list.at(-1)?.role === "user", "the last message must be from the user"),
  path: z.string().startsWith("/").max(200),
  tailored: Draft.optional(),
});

/** POST /api/assistant — one answer from Luna, plus what the browser should do next. */
export const POST = withRequestLog("POST /api/assistant", async (request: Request) => {
  const limited = rateLimit(request, "assistant", 30, 60 * 60 * 1000);
  if (limited) return limited;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "body is not valid JSON" }, { status: 400 });
  }
  const body = Body.safeParse(json);
  if (!body.success) {
    const issue = body.error.issues[0];
    return Response.json(
      { error: `${issue?.path.join(".") || "body"}: ${issue?.message ?? "invalid"}` },
      { status: 400 },
    );
  }

  try {
    const { messages, path, tailored } = body.data;
    return Response.json(await answer(await requireProfile(), messages, path, tailored));
  } catch (cause) {
    if (cause instanceof UserFacingError) {
      return Response.json({ error: cause.message }, { status: 422 });
    }
    throw cause;
  }
});
