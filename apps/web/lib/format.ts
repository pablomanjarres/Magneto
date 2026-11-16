import type { Vacancy, WorkMode } from "@moonlight/types";

const WORK_MODES: Record<WorkMode, string> = {
  remote: "Remoto",
  hybrid: "Híbrido",
  onsite: "Presencial",
};

export const workModeLabel = (mode: WorkMode): string => WORK_MODES[mode];

/** Colombian pesos in millions, because 7000000 is unreadable on a card. */
export function salaryRange(
  vacancy: Pick<Vacancy, "salaryMin" | "salaryMax" | "currency">,
): string {
  const { salaryMin, salaryMax, currency } = vacancy;
  if (salaryMin === undefined && salaryMax === undefined) return "Salario no publicado";
  const short = (n: number): string =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M` : n.toLocaleString();
  const unit = currency ?? "";
  if (salaryMin !== undefined && salaryMax !== undefined) {
    return `${short(salaryMin)}–${short(salaryMax)} ${unit}`.trim();
  }
  return `${short((salaryMin ?? salaryMax) as number)} ${unit}`.trim();
}

/**
 * "Medellín · Híbrido". Some vacancies in the dataset carry "Remote" as their
 * city, so the city is dropped when it only repeats the work mode rather than
 * printing "Remote · Remoto".
 */
export function placeMeta(v: Pick<Vacancy, "city" | "workMode">): string {
  const mode = workModeLabel(v.workMode);
  const raw = v.city.trim().toLowerCase();
  const city = raw === v.workMode || raw === mode.toLowerCase() ? "" : v.city;
  return [city, mode].filter(Boolean).join(" · ");
}

/** "Bancolombia · Medellín · Híbrido" without the empties. */
export const vacancyMeta = (v: Vacancy): string => `${v.company} · ${placeMeta(v)}`;

export const initials = (fullName: string): string =>
  fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

/** Fixed locale and UTC so the server and the browser never disagree. */
export const shortDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
