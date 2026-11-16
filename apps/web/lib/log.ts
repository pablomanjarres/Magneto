/**
 * Request logging without personal data: one JSON line per request with an id,
 * the route, the status and the time taken. Bodies, emails, tokens and résumé
 * text are never written. A crash is logged with its stack and the same id, and
 * the candidate gets a generic message carrying only that id.
 */

type Entry = Record<string, string | number | undefined>;

function write(entry: Entry): void {
  const line = JSON.stringify({ time: new Date().toISOString(), ...entry });
  if (entry["level"] === "error") console.error(line);
  else console.log(line);
}

export function withRequestLog<C>(
  route: string,
  handler: (request: Request, context: C) => Promise<Response>,
): (request: Request, context: C) => Promise<Response> {
  return async (request, context) => {
    const requestId = crypto.randomUUID();
    const started = performance.now();
    const ms = (): number => Math.round(performance.now() - started);
    try {
      const response = await handler(request, context);
      response.headers.set("x-request-id", requestId);
      write({
        level: "info",
        requestId,
        route,
        method: request.method,
        status: response.status,
        ms: ms(),
      });
      return response;
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error(String(cause));
      write({
        level: "error",
        requestId,
        route,
        method: request.method,
        status: 500,
        ms: ms(),
        error: error.message,
        stack: error.stack,
      });
      return Response.json(
        { error: "Algo falló de nuestro lado. Intenta de nuevo.", requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }
  };
}
