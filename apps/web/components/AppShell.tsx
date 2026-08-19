import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import { loadNavCounts, loadProfile } from "../lib/queries";
import { initials } from "../lib/format";
import { SideNav } from "./SideNav";
import { SignOutButton } from "./SignOutButton";

/**
 * The frame every signed-in screen sits in: side rail, top bar, content.
 * It reads the session itself and sends a stranger to the sign-in page, so a
 * page that forgot to check still cannot render anyone else's data.
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
  const profile = await loadProfile();
  if (!profile) redirect("/login");

  const counts = await loadNavCounts(profile.id);

  return (
    <div className="shell">
      <aside className="rail">
        <Link href="/dashboard" className="logo">
          <Image src="/brand/crescent.svg" alt="" width={26} height={26} priority />
          <span className="logo__word">Moon Light</span>
        </Link>

        <SideNav counts={counts} />

        <div className="rail__foot">
          <span className="avatar">{initials(profile.fullName)}</span>
          <span className="stack grow" style={{ gap: 0 }}>
            <span style={{ fontSize: 13 }}>{profile.fullName}</span>
            <span style={{ fontSize: 11, color: "var(--faint)" }}>Candidate</span>
          </span>
          <SignOutButton />
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
