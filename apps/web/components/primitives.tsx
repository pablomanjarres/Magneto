import type { ReactNode } from "react";
import Link from "next/link";

import { CountUp } from "./CountUp";
import { Icon } from "./Icon";

/**
 * The small pieces every screen repeats. One definition each, no copies.
 * Shapes follow magneto365.com: every control is a pill, flat fills, Lato bold.
 */

export type ButtonVariant = "primary" | "strong" | "quiet" | "ghost" | "danger";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  // Mint with navy text is the candidate's one primary action per screen.
  primary: "bg-mint text-mint-ink hover:bg-mint-hover",
  strong: "bg-navy text-white hover:bg-navy-hover",
  quiet: "bg-surface text-ink hover:bg-surface-strong",
  ghost: "text-brand hover:bg-brand-wash",
  danger: "text-danger hover:bg-danger-wash",
};

/** Shared by buttons and links that look like buttons, so both stay identical. */
export function buttonClass(variant: ButtonVariant = "primary", size: "md" | "sm" = "md"): string {
  const sizing = size === "md" ? "h-11 px-5 text-[15px]" : "h-9 px-3.5 text-sm";
  return `inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap transition duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${sizing} ${BUTTON_VARIANTS[variant]}`;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: "md" | "sm";
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size)}>
      {children}
    </Link>
  );
}

/** The hover every clickable card shares: a small lift and a purple-tinted shadow. */
export const liftCard =
  "transition duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[0_18px_40px_-24px_rgba(124,0,255,0.45)]";

/** The small uppercase label above a heading. */
export function Eyebrow({
  children,
  tone = "brand",
}: {
  children: ReactNode;
  tone?: "brand" | "mint";
}) {
  return (
    <p
      className={`text-xs font-bold tracking-[0.14em] uppercase ${tone === "mint" ? "text-mint" : "text-brand"}`}
    >
      {children}
    </p>
  );
}

/** An on/off pill. `aria-pressed` carries the state for screen readers. */
export function TogglePill({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-bold transition active:scale-[0.97] ${
        on
          ? "border-brand bg-brand-wash text-brand"
          : "border-line bg-canvas text-ink hover:border-brand/40"
      }`}
    >
      {on && <Icon name="check" size={14} strokeWidth={3} />}
      {children}
    </button>
  );
}

/** A white panel on the grey ground. */
export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <section className={`rounded-3xl border border-line bg-canvas ${className}`}>
      {children}
    </section>
  );
}

/** Eyebrow, title and lead at the top of every screen, with room for actions. */
export function PageHeader({
  eyebrow,
  title,
  lead,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex animate-rise flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="mt-1 text-3xl font-black text-balance text-slate sm:text-4xl">{title}</h1>
        {lead && <p className="mt-2 text-pretty text-muted">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

/** `label` names the bar: a progressbar without one is announced as a bare number. */
export function ProgressBar({
  percentage,
  label,
  thin = false,
}: {
  percentage: number;
  label?: string;
  thin?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, percentage));
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-surface-strong ${thin ? "h-1.5" : "h-2.5"}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-brand),var(--color-brand-soft),var(--color-brand))] bg-[length:200%_100%] transition-[width] duration-1000 ease-out motion-safe:animate-shimmer"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/** The match score as a navy numeral with its unit. */
export function Score({ score, large = false }: { score: number; large?: boolean }) {
  return (
    <div className="flex flex-col items-center leading-none">
      <span
        className={`font-black text-navy ${large ? "text-4xl" : "text-3xl"}`}
        aria-label={`${score}% de coincidencia`}
      >
        <CountUp value={score} />
        <span className={large ? "text-xl" : "text-base"}>%</span>
      </span>
      <span className="mt-1 text-[10px] font-bold tracking-[0.16em] text-muted uppercase">
        Match
      </span>
    </div>
  );
}

export type ChipTone = "plain" | "dashed" | "met" | "missing" | "brand";

const CHIP_TONES: Record<ChipTone, string> = {
  plain: "bg-surface text-ink",
  dashed: "border border-dashed border-control text-muted",
  met: "bg-mint-wash text-mint-deep",
  missing: "bg-danger-wash text-danger",
  brand: "bg-brand-wash text-brand",
};

export function Chip({ children, tone = "plain" }: { children: ReactNode; tone?: ChipTone }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold ${CHIP_TONES[tone]}`}
    >
      {tone === "met" && <Icon name="check" size={12} strokeWidth={3} />}
      {tone === "missing" && <Icon name="close" size={12} strokeWidth={3} />}
      {tone === "dashed" && <span className="size-1.5 rounded-full bg-control" />}
      {children}
    </span>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-control/60 bg-canvas px-6 py-10 text-center">
      <p className="font-bold text-slate">{title}</p>
      {children && <p className="mt-2 text-sm text-muted">{children}</p>}
    </div>
  );
}

/** Text inputs and selects share one look: a pill with a visible boundary. */
const FIELD =
  "w-full border border-control bg-canvas text-ink placeholder:text-faint outline-none transition focus:border-brand focus:ring-4 focus:ring-brand-wash";

export const inputClass = `h-11 rounded-full px-4 text-[15px] ${FIELD}`;

/**
 * A field of several lines: the input's border and focus with corners that do
 * not clip the text. A pill shape cannot hold a paragraph, so it is never the
 * input's class with overrides. Callers set the height and the text size.
 */
export const textareaClass = `resize-y rounded-2xl px-4 py-3 leading-relaxed ${FIELD}`;

/**
 * One labelled input. Pass `group` when the label covers several controls
 * rather than one — a `<label>` around a row of buttons points at nothing, so
 * that case gets a real group with an accessible name instead.
 */
export function Field({
  label,
  hint,
  group = false,
  children,
}: {
  label: string;
  hint?: string;
  group?: boolean;
  children: ReactNode;
}) {
  const body = (
    <>
      <span className="text-sm font-bold text-ink">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </>
  );

  return group ? (
    <div className="flex flex-col gap-2" role="group" aria-label={label}>
      {body}
    </div>
  ) : (
    <label className="flex flex-col gap-2">{body}</label>
  );
}

/** A big number with its label, for the strips of figures at the top of a screen. */
export function Stat({
  value,
  label,
  accent = false,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className={`text-3xl font-black tabular-nums ${accent ? "text-brand" : "text-navy"}`}>
        {value}
      </span>
      <span className="text-xs font-bold text-muted">{label}</span>
    </div>
  );
}
