import type { Education, Experience, Profile, WorkMode } from "@moonlight/types";

/**
 * The profile boundary. Anything arriving over HTTP is unknown until it has
 * been through here: the wizard is not the only thing that can POST a profile,
 * and every screen renders these fields without checking them again.
 *
 * It rebuilds the object field by field rather than trusting the input, so an
 * unknown key cannot reach the database and a wrong type cannot reach a page.
 */

const WORK_MODES: readonly WorkMode[] = ["remote", "hybrid", "onsite"];

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

// Colombian pesos, where 7,000,000 a month is normal: this is over a hundred
// times that, so only a typo or a broken client can reach it.
const MAX_SALARY = 1_000_000_000;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const optionalStr = (v: unknown): string | undefined => str(v) || undefined;
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const optionalNumber = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

const year = (v: unknown): number | undefined => {
  const n = optionalNumber(v);
  return n !== undefined && n >= MIN_YEAR && n <= MAX_YEAR ? Math.trunc(n) : undefined;
};

/**
 * An entry the candidate half filled is rejected, never quietly deleted:
 * dropping it showed them a finished profile and stored a shorter one.
 */
function experienceList(v: unknown, errors: string[]): Experience[] {
  return list(v).flatMap((raw, i) => {
    const e = isRecord(raw) ? raw : {};
    const company = str(e["company"]);
    const title = str(e["title"]);
    const startDate = str(e["startDate"]);
    const at = `experience ${i + 1}`;

    if (!company) errors.push(`${at} is missing a company`);
    if (!title) errors.push(`${at} is missing a title`);
    if (!startDate) errors.push(`${at} is missing a start date`);
    if (!company || !title || !startDate) return [];

    return [
      {
        company,
        title,
        startDate,
        endDate: optionalStr(e["endDate"]),
        description: optionalStr(e["description"]),
      },
    ];
  });
}

function educationList(v: unknown, errors: string[]): Education[] {
  return list(v).flatMap((raw, i) => {
    const e = isRecord(raw) ? raw : {};
    const institution = str(e["institution"]);
    const degree = str(e["degree"]);
    const startYear = year(e["startYear"]);
    const at = `education ${i + 1}`;

    if (!institution) errors.push(`${at} is missing an institution`);
    if (!degree) errors.push(`${at} is missing a degree`);
    if (startYear === undefined) {
      errors.push(`${at} needs a start year between ${MIN_YEAR} and ${MAX_YEAR}`);
    }
    if (!institution || !degree || startYear === undefined) return [];

    return [{ institution, degree, startYear, endYear: year(e["endYear"]) }];
  });
}

/** A number that is not a salary is refused; anything unreadable stays absent. */
function salary(v: unknown, field: string, errors: string[]): number | undefined {
  const n = optionalNumber(v);
  if (n === undefined) return undefined;
  if (n < 0) errors.push(`${field} cannot be negative`);
  else if (!Number.isInteger(n)) errors.push(`${field} must be a whole number`);
  else if (n > MAX_SALARY) errors.push(`${field} is larger than any real salary`);
  return n;
}

/**
 * Returns the cleaned profile, or every reason it was rejected. Never both, and
 * never a half-built profile.
 */
export function parseProfile(input: unknown): { profile: Profile } | { errors: string[] } {
  if (!isRecord(input)) return { errors: ["body must be a JSON object"] };

  const errors: string[] = [];
  const id = str(input["id"]);
  const email = str(input["email"]);
  const fullName = str(input["fullName"]);

  if (!id) errors.push("id is required");
  if (!email) errors.push("email is required");
  // Deliberately loose: one @ with something either side. A stricter pattern
  // rejects addresses that work, and the delivery does not send mail anyway.
  else if (!/^[^@\s]+@[^@\s]+$/.test(email)) errors.push("email is not an address");
  if (!fullName) errors.push("fullName is required");

  const experience = experienceList(input["experience"], errors);
  const education = educationList(input["education"], errors);

  const raw = isRecord(input["expectations"]) ? input["expectations"] : {};
  const salaryMin = salary(raw["salaryMin"], "salaryMin", errors);
  const salaryMax = salary(raw["salaryMax"], "salaryMax", errors);
  if (salaryMin !== undefined && salaryMax !== undefined && salaryMin > salaryMax) {
    errors.push("salaryMin cannot be greater than salaryMax");
  }

  if (errors.length > 0) return { errors };

  const willRelocate = raw["willRelocate"] === true;

  return {
    profile: {
      id,
      email,
      fullName,
      city: optionalStr(input["city"]),
      skills: list(input["skills"])
        .filter(isRecord)
        .map((s) => str(s["name"]))
        .filter(Boolean)
        .map((name) => ({ name })),
      experience,
      education,
      expectations: {
        targetRole: optionalStr(raw["targetRole"]),
        salaryMin,
        salaryMax,
        currency: optionalStr(raw["currency"]),
        workModes: list(raw["workModes"]).filter((m): m is WorkMode =>
          WORK_MODES.includes(m as WorkMode),
        ),
        willRelocate,
        // Cities only mean something when the candidate would move.
        cities: willRelocate ? list(raw["cities"]).map(str).filter(Boolean) : [],
      },
    },
  };
}
