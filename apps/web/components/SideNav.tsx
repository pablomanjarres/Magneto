"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon, type IconName } from "./Icon";

const LINKS: ReadonlyArray<{
  href: string;
  label: string;
  icon: IconName;
  count?: "vacancies" | "applications";
}> = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/jobs", label: "Vacancies", icon: "briefcase", count: "vacancies" },
  { href: "/applications", label: "Applications", icon: "board", count: "applications" },
  { href: "/profile", label: "Profile", icon: "user" },
];

export function SideNav({ counts }: { counts: { vacancies: number; applications: number } }) {
  const pathname = usePathname();

  return (
    <nav className="nav">
      {LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className="nav__link"
            aria-current={active ? "page" : undefined}
          >
            <Icon name={link.icon} />
            <span>{link.label}</span>
            {link.count && <span className="nav__count num">{counts[link.count]}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
