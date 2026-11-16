"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import type { ProfileChoice } from "../lib/queries";
import { chooseProfile } from "../lib/client";
import { initials } from "../lib/format";
import { Icon } from "./Icon";
import { Chip } from "./primitives";

const ITEM = '[role="menuitemradio"]';

/**
 * The avatar in the header, which also switches the profile the app acts as.
 * There is no sign-in: picking someone only sets a cookie (POST /api/session).
 * In the menu the arrows, Home and End move between profiles; Escape and Tab
 * close it and give focus back to the avatar.
 */
export function ProfileSwitcher({
  current,
  profiles,
}: {
  current: { id: string; fullName: string };
  profiles: ProfileChoice[];
}) {
  const root = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const labelId = useId();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // While open: focus starts on the current profile, Escape closes, and so
  // does a press anywhere outside.
  useEffect(() => {
    if (!open) return;
    const list = menu.current;
    (
      list?.querySelector<HTMLElement>('[aria-checked="true"]') ??
      list?.querySelector<HTMLElement>(ITEM)
    )?.focus();
    const onKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    const onPointerDown = (event: PointerEvent): void => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  function close(): void {
    setOpen(false);
    button.current?.focus();
  }

  async function choose(id: string): Promise<void> {
    if (busy) return;
    if (id === current.id) return close();
    setBusy(id);
    setError(null);
    try {
      await chooseProfile(id);
      // A fresh page rather than router.refresh(): screens keep client state built
      // from the previous person (the wizard's draft, Luna's chat, an adapted CV).
      window.location.reload();
    } catch {
      setBusy(null);
      setError("No pudimos cambiar de perfil. Intenta de nuevo.");
    }
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Tab") {
      event.preventDefault();
      return close();
    }
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>(ITEM)];
    const at = items.indexOf(document.activeElement as HTMLElement);
    const moves: Record<string, number> = {
      ArrowDown: at + 1,
      ArrowUp: at - 1,
      Home: 0,
      End: items.length - 1,
    };
    const to = moves[event.key];
    if (to === undefined) return;
    event.preventDefault();
    items[(to + items.length) % items.length]?.focus();
  }

  return (
    <div ref={root} className="relative shrink-0">
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Cambiar de perfil (actual: ${current.fullName})`}
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          setOpen(true);
        }}
        className="relative flex size-9 items-center justify-center rounded-full bg-brand-wash text-sm font-black text-brand transition hover:ring-4 hover:ring-brand/15 aria-expanded:ring-4 aria-expanded:ring-brand/25"
      >
        {initials(current.fullName)}
        <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full border-2 border-canvas bg-brand text-white">
          <Icon name="chevronDown" size={9} strokeWidth={3.5} />
        </span>
      </button>

      {open && (
        <div className="absolute top-full right-0 z-40 mt-3 w-80 max-w-[calc(100vw-2rem)] animate-pop rounded-3xl border border-line bg-canvas p-2 shadow-[0_28px_60px_-20px_rgba(26,50,76,0.45)]">
          <p id={labelId} className="px-3 pt-2 pb-1 text-sm font-bold text-muted">
            Ver la app como
          </p>
          <div
            ref={menu}
            id={menuId}
            role="menu"
            aria-labelledby={labelId}
            aria-busy={busy !== null}
            onKeyDown={onMenuKeyDown}
            className="flex flex-col gap-1"
          >
            {profiles.map((profile) => {
              const checked = profile.id === current.id;
              return (
                <button
                  key={profile.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={checked}
                  tabIndex={-1}
                  onClick={() => void choose(profile.id)}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-surface focus-visible:bg-surface"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-wash text-sm font-black text-brand"
                  >
                    {initials(profile.fullName)}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-bold text-ink">
                        {profile.fullName}
                      </span>
                      {profile.test && <Chip tone="brand">Prueba</Chip>}
                    </span>
                    <span className="truncate text-sm text-muted">
                      {busy === profile.id
                        ? "Cambiando de perfil…"
                        : (profile.targetRole ?? "Cargo objetivo sin definir")}
                    </span>
                  </span>
                  {checked && (
                    <span className="text-brand">
                      <Icon name="check" size={18} strokeWidth={2.6} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {error && (
            <p role="alert" className="px-3 py-2 text-sm font-bold text-danger">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
