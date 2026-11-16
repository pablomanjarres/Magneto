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
  { href: "/dashboard", label: "Inicio", icon: "dashboard" },
  { href: "/jobs", label: "Vacantes", icon: "briefcase", count: "vacancies" },
  { href: "/applications", label: "Postulaciones", icon: "board", count: "applications" },
  { href: "/profile", label: "Mi perfil", icon: "user" },
];

/** One outlined pill holding every section, the way empresas.magneto365.com groups its nav. */
export function TopNav({ counts }: { counts: { vacancies: number; applications: number } }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones"
      className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-line bg-canvas p-1 [scrollbar-width:none]"
    >
      {LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-bold transition-colors duration-200 ${
              active ? "bg-navy text-white" : "text-slate hover:bg-surface"
            }`}
          >
            <Icon name={link.icon} size={16} />
            {/* On a phone only the current section keeps its label; the rest are icons. */}
            <span className={active ? "" : "sr-only sm:not-sr-only"}>{link.label}</span>
            {link.count && (
              <span
                className={`rounded-full px-1.5 text-xs tabular-nums ${
                  active ? "bg-white/15" : "hidden bg-surface text-muted sm:inline"
                }`}
              >
                {counts[link.count]}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
