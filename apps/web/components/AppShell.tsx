import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { profileCompleteness } from "@moonlight/core";

import { loadNavCounts, loadProfileChoices, requireProfile } from "../lib/queries";
import { buttonClass } from "./primitives";
import { Icon } from "./Icon";
import { ProfileSwitcher } from "./ProfileSwitcher";
import { TopNav } from "./TopNav";

/**
 * The frame every screen sits in, laid out like magneto365.com/co: the purple
 * band on top, a white header with the logo and the nav, grey ground below.
 */
export async function AppShell({ children }: { children: ReactNode }) {
  const profile = await requireProfile();
  const [counts, completeness] = [await loadNavCounts(profile.id), profileCompleteness(profile)];
  const profiles = await loadProfileChoices();

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="bg-brand text-white print:hidden">
        <div className="mx-auto flex h-10 max-w-7xl items-end justify-between gap-4 px-4 sm:px-6">
          <div className="flex h-full items-end gap-3 text-sm">
            <span className="hidden self-center sm:inline">Profile Manager para:</span>
            <span className="flex h-[34px] items-center rounded-t-xl bg-canvas px-5 font-bold text-ink">
              Candidatos
            </span>
          </div>
          <p className="hidden self-center text-sm md:block">
            <strong>Reto Magneto 365</strong> · Ingeniería de Software EAFIT
            <span className="ml-2 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold">
              2026-2
            </span>
          </p>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
            <Image src="/brand/crescent.svg" alt="" width={30} height={30} priority />
            <span className="hidden text-lg font-black text-slate lg:inline">Moon Light</span>
          </Link>

          <div className="min-w-0 flex-1 md:flex md:justify-center">
            <TopNav counts={counts} />
          </div>

          <div className="hidden shrink-0 items-center gap-3 md:flex">
            {completeness.percentage < 100 && (
              <Link href="/onboarding" className={buttonClass("primary", "sm")}>
                <Icon name="sparkles" size={15} />
                Completar perfil
              </Link>
            )}
          </div>
          {/* Outside the row above, which phones hide, so every screen can switch. */}
          <ProfileSwitcher
            current={{ id: profile.id, fullName: profile.fullName }}
            profiles={profiles}
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 print:max-w-none print:bg-canvas print:p-0">
        {children}
      </main>

      <footer className="bg-surface-strong print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-muted sm:px-6">
          <span>
            <strong className="text-slate">Moon Light</strong> · Profile Manager para el reto de
            Magneto 365
          </span>
          <span>Universidad EAFIT · SI2005 · 2026-2</span>
        </div>
      </footer>
    </div>
  );
}
