import { Fragment } from "react";
import { differs, touched } from "@moonlight/core";
import type { CvDiff, CvEntryDiff, CvSectionDiff, DiffPart } from "@moonlight/types";

import { MovedChip, StatusChip, Words, markClass } from "../../../components/cv/HarvardCv";
import { EmptyState } from "../../../components/primitives";

const CARD = "flex flex-col gap-2 rounded-2xl border border-line p-4 text-sm text-ink";

/** Fields in a row, " · " between the ones that have text. */
function Joined({ fields }: { fields: DiffPart[][] }) {
  return fields
    .filter((field) => field.length > 0)
    .map((field, i) => (
      <Fragment key={i}>
        {i > 0 && " · "}
        <Words parts={field} />
      </Fragment>
    ));
}

/** One job or degree: its name, then only the fields and bullets that changed. */
function EntryCard({ entry, marked }: { entry: CvEntryDiff; marked: boolean }) {
  const meta = [entry.dates, entry.place].filter(differs);
  const bullets = entry.bullets.filter(differs);
  return (
    <li className={CARD}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-bold">
          <Joined fields={[entry.subtitle, entry.title]} />
        </p>
        {!marked && <StatusChip status={entry.status} />}
        {entry.moved !== 0 && <MovedChip by={entry.moved} />}
      </div>
      {meta.length > 0 && (
        <p className="text-xs text-muted">
          <Joined fields={meta} />
        </p>
      )}
      {bullets.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-pretty">
          {bullets.map((bullet, i) => (
            <li key={i}>
              <Words parts={bullet} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function SectionChanges({ section }: { section: CvSectionDiff }) {
  const lines = section.lines.filter(differs);
  const entries = section.entries.filter(touched);
  if (lines.length + entries.length === 0) return null;
  // A section that came or went whole is flagged once here, not on every card.
  const marked = section.status === "added" || section.status === "removed";

  return (
    <section className="flex flex-col gap-3">
      <h3 className="flex flex-wrap items-center gap-2 font-black text-slate">
        {section.title}
        <StatusChip status={section.status} />
      </h3>
      <ul className="grid items-start gap-3 md:grid-cols-2">
        {lines.map((line, i) => (
          <li key={`line:${i}`} className={CARD}>
            <p className="text-pretty">
              <Words parts={line} />
            </p>
          </li>
        ))}
        {entries.map((entry) => (
          <EntryCard key={entry.key} entry={entry} marked={marked} />
        ))}
      </ul>
    </section>
  );
}

/**
 * Only what changed, grouped by section: one card per line or entry that
 * differs or moved, so the cards add up to `diff.changes`.
 */
export function CvChanges({ diff }: { diff: CvDiff }) {
  if (diff.changes === 0) {
    return (
      <EmptyState title="Sin cambios">
        La versión adaptada quedó igual a tu hoja de vida original.
      </EmptyState>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      {diff.sections.map((section) => (
        <SectionChanges key={section.key} section={section} />
      ))}
    </div>
  );
}

/** How both views mark a change, each sample drawn the way it appears. */
export function DiffLegend() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-muted">
      <span className={markClass("added")}>Agregado</span>
      <span className={markClass("removed")}>Quitado</span>
      <span className="inline-flex items-center gap-1">
        <span aria-hidden="true" className="text-brand">
          ↑↓
        </span>
        Cambió de lugar
      </span>
    </p>
  );
}
