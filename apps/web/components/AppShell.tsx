import type { ReactNode } from "react";
import Link from "next/link";

import { loadNavCounts, loadProfile } from "../lib/queries.js";
import { initials } from "../lib/format.js";
import { SideNav } from "./SideNav.js";

/**
 * The frame every signed-in screen sits in: side rail, top bar, content.
 * It reads its own counts and candidate, so a page never passes them down.
 */
export async function AppShell({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  const [counts, profile] = await Promise.all([loadNavCounts(), loadProfile()]);

  return (
    <div className="shell">
      <aside className="rail">
        <Link href="/dashboard" className="logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/crescent.svg" alt="" width={26} height={26} />
          <span className="logo__word">Moon Light</span>
        </Link>

        <SideNav counts={counts} />

        <div className="rail__foot">
          <span className="avatar">{profile ? initials(profile.fullName) : "?"}</span>
          <span className="stack" style={{ gap: 0 }}>
            <span style={{ fontSize: 13 }}>{profile?.fullName ?? "No candidate"}</span>
            <span style={{ fontSize: 11, color: "var(--faint)" }}>Candidate</span>
          </span>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <span style={{ fontSize: 15, color: "var(--ink-secondary)" }}>{title}</span>
          {meta && <span className="meta num">{meta}</span>}
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
