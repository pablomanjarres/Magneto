import type { ReactNode } from "react";

import { Card, EmptyState } from "../../components/primitives";
import { Icon, type IconName } from "../../components/Icon";

/** One card of the profile: an icon, a heading, a line of guidance, then the contents. */
export function ProfileSection({
  title,
  hint,
  icon,
  className = "",
  children,
}: {
  title: string;
  hint: string;
  icon: IconName;
  /** Extra classes for the card, such as a staggered `[animation-delay:…]`. */
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={`flex animate-rise flex-col gap-5 p-6 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-wash text-brand">
          <Icon name={icon} size={18} />
        </span>
        <div>
          <h2 className="text-xl font-black text-slate">{title}</h2>
          <p className="text-sm text-pretty text-muted">{hint}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

/** One label-and-value line. Expectations are several of them, never several copies. */
export function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-line pt-3 first:border-t-0 first:pt-0 sm:flex-row sm:gap-4">
      <dt className="w-32 shrink-0 text-sm font-bold text-muted">{label}</dt>
      <dd className="flex flex-1 flex-wrap gap-2 text-[15px] text-ink">{children}</dd>
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

/** A timeline: a dot per entry on one rule, newest on top. */
export function EntryList({
  entries,
  empty,
  children,
}: {
  entries: Entry[];
  empty: string;
  children?: ReactNode;
}) {
  if (entries.length === 0) return <EmptyState title={empty}>{children}</EmptyState>;

  return (
    <ol className="flex flex-col gap-5 border-l-2 border-brand-wash pl-5">
      {entries.map((entry) => (
        <li key={entry.key} className="relative">
          <span className="absolute top-1.5 -left-[27px] size-3 rounded-full border-2 border-canvas bg-brand" />
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="font-bold text-slate">{entry.title}</span>
            <span className="text-xs font-bold whitespace-nowrap text-muted tabular-nums">
              {entry.period}
            </span>
          </div>
          <p className="text-sm text-muted">{entry.subtitle}</p>
          {entry.description && (
            <p className="mt-1.5 text-sm text-pretty text-ink">{entry.description}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
