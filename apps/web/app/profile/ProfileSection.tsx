import type { ReactNode } from "react";

import { EmptyState } from "../../components/primitives";

/** One card of the profile: a heading, a line of guidance, then the contents. */
export function ProfileSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section className="card stack" style={{ gap: 14, padding: "20px 22px" }}>
      <div className="stack" style={{ gap: 5 }}>
        <h2 className="h2">{title}</h2>
        <span className="meta" style={{ textWrap: "pretty" }}>
          {hint}
        </span>
      </div>
      {children}
    </section>
  );
}

/** One label-and-value line. Expectations are five of them, never five copies. */
export function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="row" style={{ gap: 14, alignItems: "flex-start" }}>
      <span className="meta" style={{ width: 116, flexShrink: 0, paddingTop: 2 }}>
        {label}
      </span>
      <div
        className="grow"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 7,
          fontSize: 13,
          color: "var(--ink-secondary)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** A job or a degree: the same four lines either way, so they share one shape. */
export interface Entry {
  key: string;
  title: string;
  period: string;
  subtitle: string;
  description?: string | undefined;
}

/** Entries are split by a rule rather than a gap, so long lists stay readable. */
export function EntryList({ entries, empty }: { entries: Entry[]; empty: string }) {
  if (entries.length === 0) return <EmptyState title={empty} />;

  return (
    <>
      {entries.map((entry, index) => (
        <div
          key={entry.key}
          className="stack"
          style={
            index === 0
              ? { gap: 4 }
              : { gap: 4, paddingTop: 14, borderTop: "1px solid var(--line)" }
          }
        >
          <div className="split">
            <span style={{ fontSize: 14.5, fontWeight: 500 }}>{entry.title}</span>
            <span className="meta num" style={{ whiteSpace: "nowrap" }}>
              {entry.period}
            </span>
          </div>
          <span className="meta" style={{ color: "var(--muted)" }}>
            {entry.subtitle}
          </span>
          {entry.description && (
            <p className="lead" style={{ paddingTop: 2 }}>
              {entry.description}
            </p>
          )}
        </div>
      ))}
    </>
  );
}
