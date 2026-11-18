"use client";

import { useMemo, useState, type ReactNode } from "react";
import { MATCH_BANDS, PAGE_SIZE, pageOf } from "@moonlight/core";
import type { WorkMode } from "@moonlight/types";

import { Icon } from "../../components/Icon";
import { TogglePill, buttonClass } from "../../components/primitives";
import { VacancyListPanel } from "../../components/VacancyListPanel";
import { WORK_MODES } from "../../components/work-modes";
import { workModeLabel } from "../../lib/format";

/**
 * The list is scored on the server and never re-fetched: filtering and sorting
 * are a view over the same ranked array, so no keystroke costs a round trip.
 * Each row arrives already rendered by the server, so this file never draws a
 * second vacancy row.
 */
export interface VacancyListItem {
  id: string;
  title: string;
  company: string;
  city: string;
  workMode: WorkMode;
  applied: boolean;
  /** Position in the server ranking, so "best match" keeps core's tie-breaks. */
  rank: number;
  salaryMax: number | undefined;
  /** Every requirement of this vacancy, joined, so the search can reach them. */
  skills: string;
  row: ReactNode;
}

type SortKey = "match" | "salary" | "company";

// The list swaps comparison strategies without changing the list code.
const SORTS: Record<SortKey, (a: VacancyListItem, b: VacancyListItem) => number> = {
  match: (a, b) => a.rank - b.rank,
  salary: (a, b) => (b.salaryMax ?? -1) - (a.salaryMax ?? -1) || a.rank - b.rank,
  company: (a, b) => a.company.localeCompare(b.company, "es") || a.rank - b.rank,
};

const SORT_LABELS: Record<SortKey, string> = {
  match: "Mejor match",
  salary: "Mayor salario",
  company: "Empresa A–Z",
};

const ANY = "any";

const pillSelect =
  "h-10 cursor-pointer rounded-full border border-line bg-canvas px-4 text-sm font-bold text-ink outline-none transition hover:border-brand/40 focus:border-brand focus:ring-4 focus:ring-brand-wash";

/** One pill select; every option list on this screen is data passed in here. */
function PillSelect({
  label,
  value,
  onChange,
  options,
  className = pillSelect,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  className?: string;
}) {
  return (
    <select
      aria-label={label}
      className={className}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

const asOptions = (anyLabel: string, values: readonly string[], label = (v: string) => v) => [
  { value: ANY, label: anyLabel },
  ...values.map((value) => ({ value, label: label(value) })),
];

export function VacancyFilters({
  title,
  items,
  cities,
  companies,
}: {
  /** The page's heading, on the bar above the list. */
  title: string;
  items: VacancyListItem[];
  cities: string[];
  companies: string[];
}) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<string>(ANY);
  const [city, setCity] = useState<string>(ANY);
  const [company, setCompany] = useState<string>(ANY);
  const [hideApplied, setHideApplied] = useState(false);
  const [sort, setSort] = useState<SortKey>("match");
  const [page, setPage] = useState(1);
  const [explained, setExplained] = useState(false);

  // A new filter is a new list, so it starts again from its first page.
  const refilter =
    <T,>(set: (value: T) => void) =>
    (value: T): void => {
      set(value);
      setPage(1);
    };

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items
      .filter((item) => {
        const haystack = `${item.title} ${item.company} ${item.skills}`.toLowerCase();
        if (needle && !haystack.includes(needle)) return false;
        if (mode !== ANY && item.workMode !== mode) return false;
        if (city !== ANY && item.city !== city) return false;
        if (company !== ANY && item.company !== company) return false;
        if (hideApplied && item.applied) return false;
        return true;
      })
      .sort(SORTS[sort]);
  }, [items, query, mode, city, company, hideApplied, sort]);

  const shown = pageOf(visible, page, PAGE_SIZE);
  const active = [
    query.trim() !== "",
    mode !== ANY,
    city !== ANY,
    company !== ANY,
    hideApplied,
  ].filter(Boolean).length;
  const filtering = active > 0;

  const clear = (): void => {
    setQuery("");
    setMode(ANY);
    setCity(ANY);
    setCompany(ANY);
    setHideApplied(false);
    setPage(1);
  };

  return (
    <>
      <form
        role="search"
        className="flex animate-rise flex-col gap-2 rounded-3xl border border-line bg-canvas p-2 sm:flex-row sm:items-center sm:rounded-full"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="flex min-w-0 flex-1 items-center gap-3 px-4">
          <span className="text-faint">
            <Icon name="search" size={18} strokeWidth={2} />
          </span>
          <span className="sr-only">Buscar</span>
          <input
            type="search"
            value={query}
            placeholder="Cargo, empresa o habilidad"
            className="h-11 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
            onChange={(event) => refilter(setQuery)(event.target.value)}
          />
        </label>
        <span className="hidden h-8 w-px bg-line sm:block" />
        <label className="flex items-center gap-2 px-4 text-faint">
          <Icon name="mapPin" size={18} />
          <PillSelect
            label="Ciudad"
            value={city}
            onChange={refilter(setCity)}
            options={asOptions("Todas las ciudades", cities)}
            className="h-11 cursor-pointer bg-transparent text-[15px] text-ink outline-none"
          />
        </label>
        <button type="submit" className={buttonClass("strong")}>
          Buscar en {visible.length} vacantes
        </button>
      </form>

      <div className="flex animate-rise flex-wrap items-center gap-2 rounded-2xl bg-surface-strong p-2.5 [animation-delay:60ms]">
        <span className="px-2 text-sm font-bold text-ink tabular-nums">Filtrar ({active})</span>
        <PillSelect
          label="Modalidad"
          value={mode}
          onChange={refilter(setMode)}
          options={asOptions("Cualquier modalidad", WORK_MODES, (v) =>
            workModeLabel(v as WorkMode),
          )}
        />
        <PillSelect
          label="Empresa"
          value={company}
          onChange={refilter(setCompany)}
          options={asOptions("Todas las empresas", companies)}
        />
        <TogglePill on={hideApplied} onClick={() => refilter(setHideApplied)(!hideApplied)}>
          Ocultar postuladas
        </TogglePill>
        {filtering && (
          <button type="button" className={buttonClass("ghost", "sm")} onClick={clear}>
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="animate-rise [animation-delay:120ms]">
        <VacancyListPanel
          heading="h1"
          title={title}
          count={
            filtering ? `${visible.length} de ${items.length} vacantes` : `${items.length} vacantes`
          }
          extra={
            <button
              type="button"
              aria-expanded={explained}
              aria-controls="match-help"
              aria-label="Cómo se calcula el match"
              onClick={() => setExplained(!explained)}
              className="grid size-6 place-items-center rounded-full bg-canvas text-xs font-black text-muted transition hover:text-brand"
            >
              ?
            </button>
          }
          action={
            <PillSelect
              label="Ordenar por"
              value={sort}
              onChange={(value) => refilter(setSort)(value as SortKey)}
              options={(Object.keys(SORTS) as SortKey[]).map((key) => ({
                value: key,
                label: SORT_LABELS[key],
              }))}
              className="h-9 cursor-pointer rounded-full bg-transparent px-2 text-sm font-bold text-ink outline-none transition hover:bg-canvas focus:ring-4 focus:ring-brand/20"
            />
          }
        >
          <p
            id="match-help"
            hidden={!explained}
            className="border-b border-line px-5 py-3 text-sm text-pretty text-slate"
          >
            El número de cada vacante es la parte de sus requisitos que ya cumples; un obligatorio
            vale tres veces un deseable. Desde {MATCH_BANDS.alto}% el match es alto y desde{" "}
            {MATCH_BANDS.medio}%, medio. Las etiquetas rojas son lo que te falta.
          </p>

          {visible.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="font-bold text-slate">Ninguna vacante coincide con estos filtros</p>
              <p className="mt-2 text-sm text-muted">
                Amplía la búsqueda y vuelve la lista completa.
              </p>
              <button
                type="button"
                className={`${buttonClass("quiet", "sm")} mt-4`}
                onClick={clear}
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <ul className="flex flex-col pb-2">
              {shown.items.map((item, index) => (
                <li
                  key={item.id}
                  className="animate-rise"
                  style={{ animationDelay: `${(index % PAGE_SIZE) * 40}ms` }}
                >
                  {item.row}
                </li>
              ))}
            </ul>
          )}

          {shown.hasMore && (
            <div className="border-t border-line p-4 text-center">
              <button
                type="button"
                className={buttonClass("quiet")}
                onClick={() => setPage(page + 1)}
              >
                Ver más vacantes
                <Icon name="chevronDown" size={16} strokeWidth={2.4} />
              </button>
            </div>
          )}
        </VacancyListPanel>
      </div>
    </>
  );
}
