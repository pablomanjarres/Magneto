import { describe, expect, it } from "vitest";

import { parseProfile } from "../src/index.js";

const valid = {
  id: "p1",
  email: "ana@example.com",
  fullName: "Ana Gómez",
  city: "Medellín",
  skills: [{ name: "TypeScript" }],
  experience: [{ company: "ACME", title: "Dev", startDate: "2024-01" }],
  education: [{ institution: "EAFIT", degree: "Ing.", startYear: 2020, endYear: 2025 }],
  expectations: {
    targetRole: "Full Stack Developer",
    salaryMin: 7_000_000,
    salaryMax: 11_000_000,
    currency: "COP",
    workModes: ["remote", "hybrid"],
    willRelocate: false,
    cities: [],
  },
};

const ok = (input: unknown) => {
  const result = parseProfile(input);
  if ("errors" in result) throw new Error(`expected a profile, got ${result.errors.join(", ")}`);
  return result.profile;
};

const errors = (input: unknown): string[] => {
  const result = parseProfile(input);
  return "errors" in result ? result.errors : [];
};

describe("parseProfile", () => {
  it("passes a well-formed profile through unchanged", () => {
    expect(ok(valid)).toEqual(valid);
  });

  it("names every missing identity field at once", () => {
    expect(errors({})).toEqual(["id is required", "email is required", "fullName is required"]);
  });

  it("rejects a body that is not an object", () => {
    expect(errors("a string")).toEqual(["body must be a JSON object"]);
    expect(errors(null)).toEqual(["body must be a JSON object"]);
    expect(errors([valid])).toEqual(["body must be a JSON object"]);
  });

  it("rejects something that is not an address", () => {
    expect(errors({ ...valid, email: "ana.example.com" })).toContain("email is not an address");
  });

  it("trims rather than storing padding", () => {
    expect(ok({ ...valid, fullName: "  Ana  ", city: " Medellín " })).toMatchObject({
      fullName: "Ana",
      city: "Medellín",
    });
  });

  it("drops a list that is the wrong type instead of storing it", () => {
    const profile = ok({ ...valid, skills: "TypeScript, React", experience: null });
    expect(profile.skills).toEqual([]);
    expect(profile.experience).toEqual([]);
  });

  it("drops entries missing the fields a screen renders", () => {
    const profile = ok({
      ...valid,
      experience: [{ company: "ACME" }, { company: "B", title: "Dev", startDate: "2020-01" }],
      education: [{ institution: "EAFIT", degree: "Ing." }],
    });
    expect(profile.experience).toHaveLength(1);
    expect(profile.education).toEqual([]);
  });

  it("keeps only real work modes", () => {
    const profile = ok({
      ...valid,
      expectations: { ...valid.expectations, workModes: ["remote", "moon", 7] },
    });
    expect(profile.expectations.workModes).toEqual(["remote"]);
  });

  it("clears cities when the candidate will not relocate", () => {
    const profile = ok({
      ...valid,
      expectations: { ...valid.expectations, willRelocate: false, cities: ["Bogotá"] },
    });
    expect(profile.expectations.cities).toEqual([]);
  });

  it("keeps cities when the candidate will relocate", () => {
    const profile = ok({
      ...valid,
      expectations: { ...valid.expectations, willRelocate: true, cities: ["Bogotá", " ", 4] },
    });
    expect(profile.expectations.cities).toEqual(["Bogotá"]);
  });

  it("refuses a salary that is not a finite number", () => {
    const profile = ok({
      ...valid,
      expectations: { ...valid.expectations, salaryMin: "7000000", salaryMax: Number.NaN },
    });
    expect(profile.expectations.salaryMin).toBeUndefined();
    expect(profile.expectations.salaryMax).toBeUndefined();
  });

  it("does not let an unknown key through to the database", () => {
    const profile = ok({ ...valid, isAdmin: true, __proto__: { hacked: true } });
    expect(Object.keys(profile).sort()).toEqual([
      "city",
      "education",
      "email",
      "expectations",
      "experience",
      "fullName",
      "id",
      "skills",
    ]);
  });
});
