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

  it("names the entry and the field instead of deleting what the candidate typed", () => {
    expect(
      errors({
        ...valid,
        experience: [
          { company: "B", title: "Dev", startDate: "2020-01" },
          { company: "ACME", startDate: "2024-01" },
        ],
        education: [{ institution: "EAFIT", degree: "Ing." }],
      }),
    ).toEqual([
      "experience 2 is missing a title",
      "education 1 needs a start year between 1900 and 2100",
    ]);
  });

  it("names every missing field of an entry at once", () => {
    expect(errors({ ...valid, experience: [{}], education: ["EAFIT"] })).toEqual([
      "experience 1 is missing a company",
      "experience 1 is missing a title",
      "experience 1 is missing a start date",
      "education 1 is missing an institution",
      "education 1 is missing a degree",
      "education 1 needs a start year between 1900 and 2100",
    ]);
  });

  it("refuses an experience with no start date rather than storing an empty one", () => {
    expect(errors({ ...valid, experience: [{ company: "ACME", title: "Dev" }] })).toEqual([
      "experience 1 is missing a start date",
    ]);
  });

  it("takes a start year at either edge of the accepted range", () => {
    const profile = ok({
      ...valid,
      education: [
        { institution: "EAFIT", degree: "Ing.", startYear: 1900 },
        { institution: "EAFIT", degree: "Ing.", startYear: 2100 },
      ],
    });
    expect(profile.education.map((e) => e.startYear)).toEqual([1900, 2100]);
  });

  it("refuses a start year outside the accepted range", () => {
    const outside = (startYear: number) =>
      errors({ ...valid, education: [{ institution: "EAFIT", degree: "Ing.", startYear }] });
    expect(outside(1899)).toEqual(["education 1 needs a start year between 1900 and 2100"]);
    expect(outside(2101)).toEqual(["education 1 needs a start year between 1900 and 2100"]);
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

  it("refuses a minimum salary above the maximum", () => {
    expect(
      errors({
        ...valid,
        expectations: { ...valid.expectations, salaryMin: 11_000_000, salaryMax: 7_000_000 },
      }),
    ).toEqual(["salaryMin cannot be greater than salaryMax"]);
  });

  it("allows a minimum equal to the maximum", () => {
    const profile = ok({
      ...valid,
      expectations: { ...valid.expectations, salaryMin: 8_000_000, salaryMax: 8_000_000 },
    });
    expect(profile.expectations.salaryMin).toBe(8_000_000);
  });

  it("refuses a salary that is not a finite number", () => {
    const profile = ok({
      ...valid,
      expectations: { ...valid.expectations, salaryMin: "7000000", salaryMax: Number.NaN },
    });
    expect(profile.expectations.salaryMin).toBeUndefined();
    expect(profile.expectations.salaryMax).toBeUndefined();
  });

  it("refuses a negative salary", () => {
    expect(errors({ ...valid, expectations: { ...valid.expectations, salaryMin: -1 } })).toEqual([
      "salaryMin cannot be negative",
    ]);
  });

  it("refuses a salary with a fraction of a peso", () => {
    expect(
      errors({ ...valid, expectations: { ...valid.expectations, salaryMax: 11_000_000.5 } }),
    ).toEqual(["salaryMax must be a whole number"]);
  });

  it("refuses a salary no job pays", () => {
    expect(
      errors({ ...valid, expectations: { ...valid.expectations, salaryMax: 1_000_000_001 } }),
    ).toEqual(["salaryMax is larger than any real salary"]);
  });

  it("takes a salary at either edge of the accepted range", () => {
    const profile = ok({
      ...valid,
      expectations: { ...valid.expectations, salaryMin: 0, salaryMax: 1_000_000_000 },
    });
    expect([profile.expectations.salaryMin, profile.expectations.salaryMax]).toEqual([
      0, 1_000_000_000,
    ]);
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
