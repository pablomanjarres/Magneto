import { describe, expect, it } from "vitest";
import type { Profile } from "@moonlight/types";

import { applyEdits } from "../src/index.js";

const profile: Profile = {
  id: "p1",
  email: "laura@example.com",
  fullName: "Laura Restrepo",
  city: "Medellín",
  skills: [{ name: "React" }, { name: "SQL" }],
  experience: [],
  education: [],
  expectations: { targetRole: "Frontend Developer", workModes: ["remote"], cities: [] },
};

describe("applyEdits", () => {
  it("sets the target area and says so", () => {
    const { profile: next, done } = applyEdits(profile, { targetArea: "Desarrollo de software" });
    expect(next.expectations.targetArea).toBe("Desarrollo de software");
    expect(done).toEqual(["Área: Desarrollo de software"]);
  });

  it("refuses an area or seniority outside the app's lists instead of claiming it", () => {
    const { profile: next, done } = applyEdits(profile, {
      targetArea: "Cocina",
      targetSeniority: "Gurú",
    });
    expect(next.expectations).toEqual(profile.expectations);
    expect(done).toEqual([]);
  });

  it("never adds a skill the profile has under another spelling", () => {
    const { profile: next, done } = applyEdits(profile, {
      addSkills: ["React.js", "Docker", "docker"],
      removeSkills: ["sql"],
    });
    expect(next.skills.map((s) => s.name)).toEqual(["React", "Docker"]);
    expect(done).toEqual(["Habilidades agregadas: Docker", "Habilidades quitadas: sql"]);
  });

  it("leaves every field it was not asked to change", () => {
    const { profile: next } = applyEdits(profile, { workModes: ["hybrid"] });
    expect(next).toEqual({
      ...profile,
      expectations: { ...profile.expectations, workModes: ["hybrid"] },
    });
  });
});
