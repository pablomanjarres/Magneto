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

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const optionalStr = (v: unknown): string | undefined => str(v) || undefined;
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const optionalNumber = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

const year = (v: unknown): number | undefined => {
  const n = optionalNumber(v);
  return n !== undefined && n >= 1900 && n <= 2100 ? Math.trunc(n) : undefined;
};

function experience(v: unknown): Experience[] {
  return list(v)
    .filter(isRecord)
    .flatMap((e) => {
      const company = str(e["company"]);
      const title = str(e["title"]);
      if (!company || !title) return [];
      return [
        {
          company,
          title,
          startDate: str(e["startDate"]),
          endDate: optionalStr(e["endDate"]),
          description: optionalStr(e["description"]),
        },
      ];
    });
}

function education(v: unknown): Education[] {
  return list(v)
    .filter(isRecord)
    .flatMap((e) => {
      const institution = str(e["institution"]);
      const degree = str(e["degree"]);
      const startYear = year(e["startYear"]);
      if (!institution || !degree || startYear === undefined) return [];
      return [{ institution, degree, startYear, endYear: year(e["endYear"]) }];
    });
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

  const raw = isRecord(input["expectations"]) ? input["expectations"] : {};
  const salaryMin = optionalNumber(raw["salaryMin"]);
  const salaryMax = optionalNumber(raw["salaryMax"]);
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
      experience: experience(input["experience"]),
      education: education(input["education"]),
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
