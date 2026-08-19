import type { Application, ApplicationStatus, Profile } from "@moonlight/types";

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

export const applyToVacancy = (profileId: string, vacancyId: string): Promise<{ application: Application }> =>
  send("/api/applications", { method: "POST", body: JSON.stringify({ profileId, vacancyId }) });

export const moveApplication = (id: string, status: ApplicationStatus): Promise<{ application: Application }> =>
  send(`/api/applications/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });

export const withdrawApplication = (id: string): Promise<null> =>
  send(`/api/applications/${id}`, { method: "DELETE" });

export const saveProfile = (profile: Profile): Promise<{ profile: Profile }> =>
  send("/api/profiles", { method: "POST", body: JSON.stringify(profile) });
