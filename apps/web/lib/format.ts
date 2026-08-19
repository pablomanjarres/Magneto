import type { Vacancy, WorkMode } from "@moonlight/types";

const WORK_MODES: Record<WorkMode, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On site",
};

export const workModeLabel = (mode: WorkMode): string => WORK_MODES[mode];

/** Colombian pesos in millions, because 7000000 is unreadable on a card. */
export function salaryRange(vacancy: Pick<Vacancy, "salaryMin" | "salaryMax" | "currency">): string {
  const { salaryMin, salaryMax, currency } = vacancy;
  if (salaryMin === undefined && salaryMax === undefined) return "Salary not stated";
  const short = (n: number): string =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M` : n.toLocaleString();
  const unit = currency ?? "";
  if (salaryMin !== undefined && salaryMax !== undefined) {
    return `${short(salaryMin)}–${short(salaryMax)} ${unit}`.trim();
  }
  return `${short((salaryMin ?? salaryMax) as number)} ${unit}`.trim();
}

/** "Frontend Developer · Bancolombia · Medellín · Hybrid" without the empties. */
export const vacancyMeta = (v: Vacancy): string =>
  [v.company, v.city, workModeLabel(v.workMode)].filter(Boolean).join(" · ");

export const initials = (fullName: string): string =>
  fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

/** Fixed locale and UTC so the server and the browser never disagree. */
export const shortDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
