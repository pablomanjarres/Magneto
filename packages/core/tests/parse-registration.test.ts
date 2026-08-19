import { describe, expect, it } from "vitest";

import { MAX_PASSWORD, MIN_PASSWORD, blankProfile, parseRegistration } from "../src/index.js";

const valid = {
  email: "nueva@example.com",
  fullName: "Nueva Candidata",
  password: "contrasena123",
  confirmPassword: "contrasena123",
};

const ok = (input: unknown) => {
  const result = parseRegistration(input);
  if ("errors" in result) throw new Error(`expected a registration: ${result.errors.join(", ")}`);
  return result.registration;
};

const errors = (input: unknown): string[] => {
  const result = parseRegistration(input);
  return "errors" in result ? result.errors : [];
};

describe("parseRegistration", () => {
  it("accepts a well-formed sign-up", () => {
    expect(ok(valid)).toEqual({
      email: valid.email,
      fullName: valid.fullName,
      password: valid.password,
    });
  });

  it("names everything missing at once", () => {
    expect(errors({})).toEqual([
      "email is required",
      "fullName is required",
      `password must be at least ${MIN_PASSWORD} characters`,
    ]);
  });

  it("rejects a body that is not an object", () => {
    expect(errors(null)).toEqual(["body must be a JSON object"]);
  });

  it("rejects something that is not an address", () => {
    expect(errors({ ...valid, email: "nueva.example.com" })).toContain("email is not an address");
  });

  it("refuses a password shorter than the minimum", () => {
    const short = "a".repeat(MIN_PASSWORD - 1);
    expect(errors({ ...valid, password: short, confirmPassword: short })).toEqual([
      `password must be at least ${MIN_PASSWORD} characters`,
    ]);
  });

  it("takes a password of exactly the minimum", () => {
    const edge = "a".repeat(MIN_PASSWORD);
    expect(ok({ ...valid, password: edge, confirmPassword: edge }).password).toBe(edge);
  });

  it("refuses a password longer than the maximum", () => {
    const long = "a".repeat(MAX_PASSWORD + 1);
    expect(errors({ ...valid, password: long, confirmPassword: long })).toEqual([
      `password must be at most ${MAX_PASSWORD} characters`,
    ]);
  });

  it("refuses two passwords that disagree", () => {
    expect(errors({ ...valid, confirmPassword: "something else" })).toEqual([
      "the passwords do not match",
    ]);
  });

  it("does not require a confirmation the caller never sent", () => {
    // The API takes a registration without one; only the form insists.
    expect(
      errors({ email: valid.email, fullName: valid.fullName, password: valid.password }),
    ).toEqual([]);
  });

  it("never trims the password, because a space is a character", () => {
    const spaced = " leading and trailing ";
    expect(ok({ ...valid, password: spaced, confirmPassword: spaced }).password).toBe(spaced);
  });

  it("trims the email and the name, which are not secrets", () => {
    expect(ok({ ...valid, email: "  nueva@example.com ", fullName: " Nueva  " })).toMatchObject({
      email: "nueva@example.com",
      fullName: "Nueva",
    });
  });
});

describe("blankProfile", () => {
  it("starts empty, because delivery 1 imports nothing to pre-fill it with", () => {
    const profile = blankProfile("id-1", ok(valid));
    expect(profile).toMatchObject({
      id: "id-1",
      email: valid.email,
      fullName: valid.fullName,
      skills: [],
      experience: [],
      education: [],
    });
    expect(profile.expectations.workModes).toEqual([]);
    expect(profile.expectations.willRelocate).toBe(false);
  });
});
