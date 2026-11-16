import { Fragment, type ReactNode } from "react";
import { diffCv } from "@moonlight/core";
import type {
  CvDiff,
  CvDocument,
  CvEntryDiff,
  CvSectionDiff,
  DiffPart,
  DiffStatus,
} from "@moonlight/types";

import { Chip, type ChipTone } from "../primitives";

type Side = "before" | "after";
type Change = "added" | "removed";

/** Each side draws its own kind of change and leaves the other side's out. */
const SHOWS: Record<Side, Change> = { after: "added", before: "removed" };
const HIDES: Record<Side, Change> = { after: "removed", before: "added" };

/** Every change has a cue besides colour (underline, strike, bar, chip), so it survives a grey printer. */
const MARKS: Record<Change, { tone: ChipTone; label: string; words: string; bar: string }> = {
  added: {
    tone: "met",
    label: "Nuevo",
    words: "bg-mint-wash text-mint-deep underline underline-offset-[0.2em]",
    bar: "bg-mint print:bg-mint-deep",
  },
  removed: {
    tone: "missing",
    label: "Quitado",
    words: "bg-danger-wash text-danger line-through",
    bar: "bg-danger",
  },
};

/** The highlight on changed words, shared with the list of changes and its legend. */
export const markClass = (change: Change): string =>
  `rounded-[0.2em] box-decoration-clone px-[0.15em] ${MARKS[change].words}`;

const SHEET =
  "mx-auto aspect-[8.5/11] w-full max-w-[8.5in] rounded-sm border border-line bg-canvas px-[clamp(1.25rem,7cqi,0.75in)] py-[clamp(1.5rem,6cqi,0.6in)] font-cv leading-[1.35] text-ink-strong wrap-break-word shadow-[0_28px_60px_-32px_rgba(26,50,76,0.45)] [-webkit-print-color-adjust:exact] [print-color-adjust:exact] print:aspect-auto print:max-w-none print:rounded-none print:border-0 print:p-[0.15in] print:shadow-none";

/**
 * Everything inside is sized in em, so the type alone scales the sheet; it follows the sheet's width.
 * Compact fits two sheets side by side, and goes back to the readable size once they stack.
 */
const TYPE = {
  regular: "text-[clamp(13.5px,1.85cqi,15px)] print:text-[11pt]",
  compact: "text-[clamp(11px,2cqi,12.5px)] @max-md:text-[13.5px]",
};

const shown = (parts: DiffPart[], side: Side): DiffPart[] =>
  parts.filter((part) => part.kind !== HIDES[side]);

const blank = (parts: DiffPart[], side: Side): boolean =>
  shown(parts, side).every((part) => part.text.trim() === "");

/**
 * The entries as the original CV had them. Core lists them in the new order, each
 * removed one right above the entry that followed it, so a run of removed entries
 * travels with the kept entry below it, which goes back `moved` places.
 */
function inBeforeOrder(entries: CvEntryDiff[]): CvEntryDiff[] {
  const runs: Array<{ at: number; entries: CvEntryDiff[] }> = [];
  let run: CvEntryDiff[] = [];
  for (const entry of entries) {
    if (entry.status === "added") continue;
    run.push(entry);
    if (entry.status === "removed") continue;
    runs.push({ at: runs.length - entry.moved, entries: run });
    run = [];
  }
  return [...runs.sort((a, b) => a.at - b.at).flatMap((r) => r.entries), ...run];
}

/**
 * One run of text. A side draws only its own kind of change; with no side the old
 * and new words show together. The mark hugs the changed words, not the spaces around them.
 */
export function Words({ parts, side }: { parts: DiffPart[]; side?: Side }) {
  const visible = side ? shown(parts, side) : parts;
  return visible.map((part, i) => {
    const core = part.text.trim();
    if (part.kind === "same" || core === "") return part.text;
    const start = part.text.indexOf(core);
    const Mark = part.kind === "added" ? "ins" : "del";
    // A replacement's two marks would otherwise touch and read as one word.
    const apart = part.kind === "added" && visible[i - 1]?.kind === "removed" ? " ml-[0.2em]" : "";
    return (
      <Fragment key={i}>
        {part.text.slice(0, start)}
        <Mark className={markClass(part.kind) + apart}>{core}</Mark>
        {part.text.slice(start + core.length)}
      </Fragment>
    );
  });
}

/** "Nuevo" or "Quitado" for an entry or section that came or went whole; nothing otherwise. */
export function StatusChip({ status }: { status: DiffStatus }) {
  if (status !== "added" && status !== "removed") return null;
  return <Chip tone={MARKS[status].tone}>{MARKS[status].label}</Chip>;
}

/** "↑ Subió 2" or "↓ Bajó 1": negative went up, positive went down. */
export function MovedChip({ by }: { by: number }) {
  return (
    <Chip tone="brand">
      <span aria-hidden="true">{by < 0 ? "↑" : "↓"}</span>
      {by < 0 ? "Subió" : "Bajó"} {Math.abs(by)}
    </Chip>
  );
}

/** "Técnicas: React, SQL": the label before the colon is bold, as in the Harvard skills block. */
function Labelled({ parts, side }: { parts: DiffPart[]; side: Side }) {
  const [first, ...rest] = shown(parts, side);
  const label = first && /^[^:]{1,40}:/.exec(first.text)?.[0];
  if (!first || !label) return <Words parts={parts} side={side} />;
  return (
    <>
      <strong className="font-bold">
        <Words parts={[{ ...first, text: label }]} side={side} />
      </strong>
      <Words parts={[{ ...first, text: first.text.slice(label.length) }, ...rest]} side={side} />
    </>
  );
}

/** A Harvard line: text on the left and a detail flush right, which drops below on a narrow sheet. */
function Row({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-[1em]">
      <div className="min-w-0">{children}</div>
      {aside && <div className="ml-auto text-right">{aside}</div>}
    </div>
  );
}

/** The app speaking about the CV rather than the CV itself, so it keeps the app's type. */
function Flag({ children }: { children: ReactNode }) {
  return (
    <span className="ml-[0.5em] inline-flex align-middle font-sans leading-none tracking-normal normal-case">
      {children}
    </span>
  );
}

/** A change bar in the margin, as revised documents carry, so the text keeps its alignment. */
function Bar({ change }: { change: Change }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute inset-y-0 -left-[0.9em] w-[3px] rounded-full ${MARKS[change].bar}`}
    />
  );
}

function Entry({ entry, side, marked }: { entry: CvEntryDiff; side: Side; marked: boolean }) {
  // Inside a section that is new or gone as a whole, the section's own mark says it once.
  const change = !marked && entry.status === SHOWS[side] ? SHOWS[side] : null;
  const moved = side === "after" ? entry.moved : 0;
  const bullets = entry.bullets.filter((bullet) => !blank(bullet, side));
  const hasSecondRow = !blank(entry.subtitle, side) || !blank(entry.dates, side);

  return (
    <div className="relative break-inside-avoid">
      {change && <Bar change={change} />}
      <Row aside={!blank(entry.place, side) && <Words parts={entry.place} side={side} />}>
        <span className="font-bold tracking-[0.04em] uppercase">
          <Words parts={entry.title} side={side} />
        </span>
        {change && (
          <Flag>
            <StatusChip status={change} />
          </Flag>
        )}
        {moved !== 0 && (
          <Flag>
            <MovedChip by={moved} />
          </Flag>
        )}
      </Row>
      {hasSecondRow && (
        <Row
          aside={
            !blank(entry.dates, side) && (
              <span className="tabular-nums lining-nums">
                <Words parts={entry.dates} side={side} />
              </span>
            )
          }
        >
          <em>
            <Words parts={entry.subtitle} side={side} />
          </em>
        </Row>
      )}
      {bullets.length > 0 && (
        <ul className="mt-[0.15em] list-disc space-y-[0.1em] pl-[1.3em]">
          {bullets.map((bullet, i) => (
            <li key={i} className="pl-[0.15em] text-pretty">
              <Words parts={bullet} side={side} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Section({ section, side }: { section: CvSectionDiff; side: Side }) {
  const change = section.status === SHOWS[side] ? SHOWS[side] : null;
  const lines = section.lines.filter((line) => !blank(line, side));
  const entries =
    side === "before"
      ? inBeforeOrder(section.entries)
      : section.entries.filter((entry) => entry.status !== "removed");
  if (lines.length === 0 && entries.length === 0) return null;
  const Line = section.key === "skills" ? Labelled : Words;

  return (
    <section className="relative mt-[1.1em]">
      {change && <Bar change={change} />}
      <h3 className="mb-[0.45em] border-b border-ink-strong pb-[0.1em] text-center text-[1em] font-bold tracking-widest uppercase break-after-avoid">
        {section.title}
        {change && (
          <Flag>
            <StatusChip status={change} />
          </Flag>
        )}
      </h3>
      {lines.length > 0 && (
        <div className="space-y-[0.2em]">
          {lines.map((line, i) => (
            <p key={i} className="text-pretty">
              <Line parts={line} side={side} />
            </p>
          ))}
        </div>
      )}
      {entries.length > 0 && (
        <div className={`space-y-[0.65em] ${lines.length > 0 ? "mt-[0.5em]" : ""}`}>
          {entries.map((entry) => (
            <Entry key={entry.key} entry={entry} side={side} marked={change !== null} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * A CV in the Harvard format, drawn as the printed page. Give it a `doc`, or a
 * `diff` and the side to draw: "after" marks what was added, "before" what was
 * removed. `standalone` makes the name a heading under the page's h1; sections are h3.
 */
export function HarvardCv(
  props: ({ doc: CvDocument } | { diff: CvDiff; side: Side }) & {
    compact?: boolean;
    standalone?: boolean;
  },
) {
  // A plain CV is a diff with nothing changed, so both modes draw through the same markup.
  const [diff, side]: [CvDiff, Side] =
    "doc" in props ? [diffCv(props.doc, props.doc), "after"] : [props.diff, props.side];
  const Name = props.standalone ? "h2" : "p";

  return (
    <div className="@container">
      <article className={`${SHEET} ${props.compact ? TYPE.compact : TYPE.regular}`}>
        <header className="text-center">
          <Name className="text-[1.9em] leading-tight font-bold">
            <Words parts={diff.name} side={side} />
          </Name>
          {!blank(diff.contact, side) && (
            <p className="mt-[0.3em] text-[0.95em]">
              <Words parts={diff.contact} side={side} />
            </p>
          )}
        </header>
        {diff.sections
          .filter((section) => section.status !== HIDES[side])
          .map((section) => (
            <Section key={section.key} section={section} side={side} />
          ))}
      </article>
    </div>
  );
}
