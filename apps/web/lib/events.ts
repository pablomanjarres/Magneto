import type { ApplicationEvent } from "@moonlight/types";
import { ApplicationEvents } from "@moonlight/core";
import { recordEvent } from "@moonlight/db";

/** The app's one event bus. The activity log is its first listener. */
export const applicationEvents = new ApplicationEvents();

applicationEvents.subscribe(async (event) => {
  await recordEvent(event);
});

/**
 * Publish after a mutation already succeeded. A listener failing is logged,
 * never turned into an error for the candidate.
 */
export async function publish(event: Omit<ApplicationEvent, "id" | "createdAt">): Promise<void> {
  const failures = await applicationEvents.publish({
    ...event,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
  for (const failure of failures) console.error("application event listener failed", failure);
}
