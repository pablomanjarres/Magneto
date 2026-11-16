"use client";

import { useMemo, useState, type ReactNode } from "react";
import { PAGE_SIZE, pageOf } from "@moonlight/core";
import type { WorkMode } from "@moonlight/types";

import { Icon } from "../../components/Icon";
import { EmptyState, TogglePill, buttonClass } from "../../components/primitives";
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
  items,
  cities,
  companies,
}: {
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
  const filtering =
    query.trim() !== "" || mode !== ANY || city !== ANY || company !== ANY || hideApplied;

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
        className="flex animate-rise flex-col gap-2 rounded-3xl border border-line bg-canvas p-2 sm:flex-row sm:items-center sm:rounded-full [animation-delay:120ms]"
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

      <div className="flex animate-rise flex-wrap items-center gap-2 [animation-delay:180ms]">
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
        <span className="ml-auto flex items-center gap-2 text-sm text-muted">
          Ordenar por
          <PillSelect
            label="Ordenar por"
          <div style={{ width: 150 }}>
            <Field label="Work mode">
              <select
                className="select"
                value={mode}
                onChange={(event) => refilter(setMode)(event.target.value)}
              >
                <option value={ANY}>Any mode</option>
                {WORK_MODES.map((value) => (
                  <option key={value} value={value}>
                    {workModeLabel(value)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ width: 170 }}>
            <Field label="Company">
              <select
                className="select"
                value={company}
                onChange={(event) => refilter(setCompany)(event.target.value)}
              >
                <option value={ANY}>Any company</option>
                {companies.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ width: 170 }}>
            <Field label="City">
              <select
                className="select"
                value={city}
                onChange={(event) => refilter(setCity)(event.target.value)}
              >
                <option value={ANY}>Any city</option>
                {cities.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <label className="check" style={{ height: 42 }}>
            <input
              type="checkbox"
              checked={hideApplied}
              onChange={(event) => refilter(setHideApplied)(event.target.checked)}
            />
            Hide vacancies I already applied to
          </label>
        </div>

        <div
          className="split"
          style={{ alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: 12 }}
        >
          <span className="meta num" style={{ color: "var(--ink-secondary)" }}>
            {visible.length} of {items.length} vacancies
          </span>
          <span className="row" style={{ gap: 10 }}>
            {filtering && (
              <button type="button" className="btn btn--sm" onClick={clear}>
                Clear filters
              </button>
            )}
            <span className="meta">Sorted by match score</span>
          </span>
        </div>
      </section>

      {visible.length === 0 ? (
        <EmptyState title="No vacancy matches these filters">
          Widen the search and the whole ranked list comes back.{" "}
          <button type="button" className="btn btn--sm" onClick={clear}>
            Clear filters
          </button>
        </EmptyState>
      ) : (
        <div className="stack" style={{ gap: 10 }}>
          {shown.items.map((item) => (
            <Fragment key={item.id}>{item.row}</Fragment>
          ))}
          {shown.hasMore && (
            <button
              type="button"
              className="btn btn--sm"
              style={{ alignSelf: "center" }}
              onClick={() => setPage(page + 1)}
            >
              Load more
            </button>
          )}
        </div>
      )}

      {hidden > 0 && visible.length > 0 && (
        <p className="meta" style={{ textAlign: "center" }}>
          <span className="num">{hidden}</span> hidden by your filters —{" "}
          <button
            type="button"
            onClick={clear}
            style={{
              border: 0,
              padding: 0,
              background: "none",
              color: "var(--glow)",
              cursor: "pointer",
              fontSize: "inherit",
            }}
          >
            show the rest
          </button>
        </p>
      )}
    </>
  );
}
