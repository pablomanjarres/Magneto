import type { Profile } from "@moonlight/types";

/**
 * What a candidate has to give to create an account. Delivery 1 imports nothing
 * from LinkedIn, so this is the only door in and the only thing standing
 * between a typo and a profile nobody can sign into again.
 */

export interface Registration {
  email: string;
  fullName: string;
  password: string;
}

/** Long enough to be worth hashing, short enough that scrypt stays quick. */
export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 200;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const str = (v: unknown): string => (typeof v === "string" ? v : "");

export function parseRegistration(
  input: unknown,
): { registration: Registration } | { errors: string[] } {
  if (!isRecord(input)) return { errors: ["body must be a JSON object"] };

  const errors: string[] = [];
  const email = str(input["email"]).trim();
  const fullName = str(input["fullName"]).trim();
  // Never trimmed: a space is a legitimate character in a password, and
  // trimming one silently would lock the candidate out of their own account.
  const password = str(input["password"]);
  const confirm = str(input["confirmPassword"]);

  if (!email) errors.push("email is required");
  else if (!/^[^@\s]+@[^@\s]+$/.test(email)) errors.push("email is not an address");
  if (!fullName) errors.push("fullName is required");
  if (password.length < MIN_PASSWORD) {
    errors.push(`password must be at least ${MIN_PASSWORD} characters`);
  } else if (password.length > MAX_PASSWORD) {
    errors.push(`password must be at most ${MAX_PASSWORD} characters`);
  }
  // Only checked when the caller sent one: the API does not require it, the
  // form does, and neither should disagree with the other about the rule.
  if (confirm !== "" && confirm !== password) errors.push("the passwords do not match");

  return errors.length > 0 ? { errors } : { registration: { email, fullName, password } };
}

/** The empty profile a new candidate starts from, before the wizard runs. */
export function blankProfile(id: string, registration: Registration): Profile {
  return {
    id,
    email: registration.email,
    fullName: registration.fullName,
    city: undefined,
    skills: [],
    experience: [],
    education: [],
    expectations: {
      targetRole: undefined,
      salaryMin: undefined,
      salaryMax: undefined,
      currency: "COP",
      workModes: [],
      willRelocate: false,
      cities: [],
    },
  };
}
