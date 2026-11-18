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
 * The vacancy's city, or "" where the dataset only repeats the work mode there:
 * some vacancies carry "Remote" as their city.
 */
export function cityName(v: Pick<Vacancy, "city" | "workMode">): string {
  const raw = v.city.trim().toLowerCase();
  return raw === v.workMode || raw === workModeLabel(v.workMode).toLowerCase() ? "" : v.city;
}

/** "Medellín · Híbrido", never "Remote · Remoto". */
export function placeMeta(v: Pick<Vacancy, "city" | "workMode">): string {
  return [cityName(v), workModeLabel(v.workMode)].filter(Boolean).join(" · ");
}

/** "Bancolombia · Medellín · Híbrido" without the empties. */
export const vacancyMeta = (v: Vacancy): string => `${v.company} · ${placeMeta(v)}`;

/** What to call a profile on screen: its name, or "Perfil nuevo" while it has none. */
export const profileName = (fullName: string): string => fullName.trim() || "Perfil nuevo";

/** What a saved résumé PDF is named after: whose it is, when the profile has a name. */
export const cvTitle = (fullName: string, ...rest: string[]): string =>
  [fullName.trim(), "Hoja de vida", ...rest].filter(Boolean).join(" · ");

/** Empty for a profile with no name yet: show a person icon there instead. */
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
