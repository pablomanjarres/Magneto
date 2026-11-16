import { describe, expect, it } from "vitest";
import type { ApplicationEvent, ApplicationEventKind } from "@moonlight/types";

import { ApplicationEvents, describeEvent } from "../src/index.js";

const event = (kind: ApplicationEventKind, detail?: string): ApplicationEvent => ({
  id: "e1",
  profileId: "p1",
  vacancyId: "v1",
  applicationId: "a1",
  kind,
  detail,
  createdAt: "2026-11-16T12:00:00.000Z",
});

describe("ApplicationEvents", () => {
  it("delivers a published event to every subscriber", async () => {
    const events = new ApplicationEvents();
    const seen: string[] = [];
    events.subscribe((e) => void seen.push(`a:${e.kind}`));
    events.subscribe((e) => void seen.push(`b:${e.kind}`));

    const failures = await events.publish(event("applied"));

    expect(seen).toEqual(["a:applied", "b:applied"]);
    expect(failures).toEqual([]);
  });

  it("stops delivering after unsubscribe", async () => {
    const events = new ApplicationEvents();
    const seen: string[] = [];
    const unsubscribe = events.subscribe((e) => void seen.push(e.kind));

    await events.publish(event("applied"));
    unsubscribe();
    await events.publish(event("note"));

    expect(seen).toEqual(["applied"]);
  });

  it("keeps calling the others when one listener throws, and returns the failure", async () => {
    const events = new ApplicationEvents();
    const seen: string[] = [];
    const boom = new Error("db down");
    events.subscribe(() => {
      throw boom;
    });
    events.subscribe(async () => Promise.reject(new Error("also down")));
    events.subscribe((e) => void seen.push(e.kind));

    const failures = await events.publish(event("withdrawn"));

    expect(seen).toEqual(["withdrawn"]);
    expect(failures).toHaveLength(2);
    expect(failures[0]).toBe(boom);
  });
});

describe("describeEvent", () => {
  it("writes one Spanish sentence per kind", () => {
    expect(describeEvent(event("applied"), "Frontend Developer")).toBe(
      "Te postulaste a Frontend Developer",
    );
    expect(describeEvent(event("moved", "in-review→interview"), "Backend Developer")).toBe(
      "Moviste Backend Developer a Entrevista",
    );
    expect(describeEvent(event("note"), "QA Analyst")).toBe(
      "Anotaste el próximo paso de QA Analyst",
    );
    expect(describeEvent(event("withdrawn"), "Data Engineer")).toBe(
      "Retiraste tu postulación a Data Engineer",
    );
  });

  it("does not print a raw status when the move detail is unreadable", () => {
    expect(describeEvent(event("moved", "nonsense"), "X")).toBe("Moviste X a otra columna");
  });
});
