import type { ApplicationEvent } from "@moonlight/types";

import { STATUS_LABELS, isApplicationStatus } from "./index.js";

export type ApplicationEventListener = (event: ApplicationEvent) => void | Promise<void>;

/** The subject of an Observer: routes publish, listeners react. */
export class ApplicationEvents {
  private readonly listeners = new Set<ApplicationEventListener>();

  subscribe(listener: ApplicationEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Calls every listener, even after one fails. A side effect must never undo
   * the mutation that already happened, so failures come back instead of throwing.
   */
  async publish(event: ApplicationEvent): Promise<unknown[]> {
    const results = await Promise.allSettled(
      [...this.listeners].map(async (listener) => listener(event)),
    );
    return results.flatMap((r) => (r.status === "rejected" ? [r.reason] : []));
  }
}

/** "applied→in-review" names the status the application landed in. */
const movedTo = (detail: string | undefined): string => {
  const to = detail?.split("→")[1];
  return isApplicationStatus(to) ? STATUS_LABELS[to] : "otra columna";
};

/** The log line the candidate reads. Pure. */
export function describeEvent(event: ApplicationEvent, vacancyTitle: string): string {
  switch (event.kind) {
    case "applied":
      return `Te postulaste a ${vacancyTitle}`;
    case "moved":
      return `Moviste ${vacancyTitle} a ${movedTo(event.detail)}`;
    case "note":
      return `Anotaste el próximo paso de ${vacancyTitle}`;
    case "withdrawn":
      return `Retiraste tu postulación a ${vacancyTitle}`;
  }
}
