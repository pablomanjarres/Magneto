import type {
  Application,
  ApplicationStatus,
  ImportEvent,
  Profile,
  TailoredProfile,
} from "@moonlight/types";

/**
 * The browser side of the API. Every mutation goes through the route handlers
 * rather than a server action, so the endpoints are the ones the demo video
 * shows returning JSON.
 */

async function send<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...init.headers },
  });
  const body: unknown = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const error = (body as { error?: string } | null)?.error;
    throw new Error(error ?? `request failed with ${response.status}`);
  }
  return body as T;
}

export const applyToVacancy = (
  profileId: string,
  vacancyId: string,
): Promise<{ application: Application }> =>
  send("/api/applications", { method: "POST", body: JSON.stringify({ profileId, vacancyId }) });

export const moveApplication = (
  id: string,
  status: ApplicationStatus,
): Promise<{ application: Application }> =>
  send(`/api/applications/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });

export const updateNextStep = (
  id: string,
  note: string | null,
): Promise<{ application: Application }> =>
  send(`/api/applications/${id}`, { method: "PATCH", body: JSON.stringify({ note }) });

export const withdrawApplication = (id: string): Promise<null> =>
  send(`/api/applications/${id}`, { method: "DELETE" });

export const tailorProfile = (
  profileId: string,
  vacancyId: string,
): Promise<{ tailored: TailoredProfile; check: { ok: boolean; problems: string[] } }> =>
  send(`/api/profiles/${profileId}/tailor`, {
    method: "POST",
    body: JSON.stringify({ vacancyId }),
  });

export const saveProfile = (profile: Profile): Promise<{ profile: Profile }> =>
  send("/api/profiles", { method: "POST", body: JSON.stringify(profile) });

/**
 * Starts an import and hands every streamed step to `onEvent` as it arrives.
 * Rejected input (400) and rate limits (429) throw with the server's message;
 * the stream itself reports failures as an `error` event.
 */
export async function startImport(
  input: { url: string } | { file: File },
  onEvent: (event: ImportEvent) => void,
): Promise<void> {
  let init: RequestInit;
  if ("file" in input) {
    const form = new FormData();
    form.append("file", input.file);
    init = { method: "POST", body: form };
  } else {
    init = {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: input.url }),
    };
  }

  const response = await fetch("/api/imports", init);
  if (!response.ok || !response.body) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `No pudimos iniciar la importación (error ${response.status}).`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const flush = (block: string): void => {
    for (const line of block.split("\n")) {
      if (line.startsWith("data:")) onEvent(JSON.parse(line.slice(5).trim()) as ImportEvent);
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";
    blocks.forEach(flush);
  }
  flush(buffer + decoder.decode());
}
