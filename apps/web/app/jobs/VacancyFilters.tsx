"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import type { WorkMode } from "@moonlight/types";

import { Icon } from "../../components/Icon";
import { EmptyState, Field } from "../../components/primitives";
import { workModeLabel } from "../../lib/format";

/**
 * The list is scored on the server and never re-fetched: filtering is a view
 * over the same ranked array, so the order the recommendation produced stays
 * intact and no keystroke costs a round trip. Each row arrives already
 * rendered by the server, so this file never draws a second vacancy row.
 */
export interface VacancyListItem {
  id: string;
  title: string;
  company: string;
  city: string;
  workMode: WorkMode;
  applied: boolean;
  /** Every requirement of this vacancy, joined, so the search can reach them. */
  skills: string;
  row: ReactNode;
}

const ANY = "any";
const WORK_MODES: ReadonlyArray<WorkMode> = ["remote", "hybrid", "onsite"];

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

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const haystack = `${item.title} ${item.company} ${item.skills}`.toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (mode !== ANY && item.workMode !== mode) return false;
      if (city !== ANY && item.city !== city) return false;
      if (company !== ANY && item.company !== company) return false;
      if (hideApplied && item.applied) return false;
      return true;
    });
  }, [items, query, mode, city, company, hideApplied]);

  const hidden = items.length - visible.length;
  const filtering =
    query.trim() !== "" || mode !== ANY || city !== ANY || company !== ANY || hideApplied;

  const clear = (): void => {
    setQuery("");
    setMode(ANY);
    setCity(ANY);
    setCompany(ANY);
    setHideApplied(false);
  };

  return (
    <>
      <section className="card stack" style={{ gap: 14, padding: "16px 18px" }}>
        <div className="row" style={{ gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="grow" style={{ minWidth: 240 }}>
            <Field label="Search">
              <span style={{ position: "relative", display: "block" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "flex",
                    color: "var(--faint)",
                  }}
                >
                  <Icon name="search" size={15} strokeWidth={2} />
                </span>
                <input
                  className="input"
                  style={{ paddingLeft: 36 }}
                  type="search"
                  value={query}
                  placeholder="Title, company or a skill"
                  onChange={(event) => setQuery(event.target.value)}
                />
              </span>
            </Field>
          </div>

          <div style={{ width: 150 }}>
            <Field label="Work mode">
              <select
                className="select"
                value={mode}
                onChange={(event) => setMode(event.target.value)}
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
                onChange={(event) => setCompany(event.target.value)}
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
                onChange={(event) => setCity(event.target.value)}
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
              onChange={(event) => setHideApplied(event.target.checked)}
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
          {visible.map((item) => (
            <Fragment key={item.id}>{item.row}</Fragment>
          ))}
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
