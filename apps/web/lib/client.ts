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

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** What the browser does after Luna answers, in order. */
export type AssistantAction =
  | { type: "navigate"; path: string }
  | { type: "refresh" }
  | { type: "tailored"; tailored: TailoredProfile }
  /** The profile changed; `before` is how it was, so the change can be undone. */
  | { type: "saved"; before: Profile };

/** One turn with Luna: the conversation so far, the page it is on and the last adapted CV. */
export const askAssistant = (
  messages: ChatMessage[],
  path: string,
  tailored?: TailoredProfile,
): Promise<{ reply: string; actions: AssistantAction[] }> =>
  send("/api/assistant", {
    method: "POST",
    body: JSON.stringify({
      messages,
      path,
      // JSON drops undefined, and the API wants every open-ended job as an explicit null.
      tailored: tailored && {
        ...tailored,
        experience: tailored.experience.map((e) => ({ ...e, endDate: e.endDate ?? null })),
      },
    }),
  });

/** Which profile the app acts as; there is no sign-in, only this choice. */
export const chooseProfile = (profileId: string): Promise<unknown> =>
  send("/api/session", { method: "POST", body: JSON.stringify({ profileId }) });

/** Acts as an empty profile from now on: one still untouched, or a new one. */
export const chooseBlankProfile = (): Promise<unknown> =>
  send("/api/session", { method: "POST", body: JSON.stringify({ blank: true }) });

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
