"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon, type IconName } from "./Icon";
import { useSlidingPill, type PillMemory } from "./sliding-pill";

const LINKS: ReadonlyArray<{
  href: string;
  label: string;
  icon: IconName;
  count?: "vacancies" | "applications";
}> = [
  { href: "/dashboard", label: "Inicio", icon: "dashboard" },
  { href: "/jobs", label: "Vacantes", icon: "briefcase", count: "vacancies" },
  { href: "/applications", label: "Postulaciones", icon: "board", count: "applications" },
  { href: "/cv", label: "Mi CV", icon: "document" },
  { href: "/profile", label: "Mi perfil", icon: "user" },
];

/** Every page mounts its own TopNav, so where the pill last sat is kept out here. */
const lastPill: PillMemory<string | undefined> = { current: null };

/** One outlined pill holding every section, the way empresas.magneto365.com groups its nav. */
export function TopNav({ counts }: { counts: { vacancies: number; applications: number } }) {
  const pathname = usePathname();
  const current = LINKS.find(
    (link) => pathname === link.href || pathname.startsWith(`${link.href}/`),
  )?.href;
  const { pill, lit } = useSlidingPill(current, lastPill);

  return (
    <nav
      aria-label="Secciones"
      className="relative flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-line bg-canvas p-1 [scrollbar-width:none]"
    >
      {pill}
      {LINKS.map((link) => {
        const tone = lit(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={link.href === current ? "page" : undefined}
            className={`relative flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-bold transition-colors duration-200 ${
              tone ?? "text-slate hover:bg-surface"
            }`}
          >
            <Icon name={link.icon} size={16} />
            {/* Five labels do not fit a phone, so there every section is an icon with a hidden name. */}
            <span className="sr-only sm:not-sr-only">{link.label}</span>
            {link.count && (
              <span
                className={`hidden rounded-full px-1.5 text-xs tabular-nums sm:inline ${
                  tone ? "bg-white/15" : "bg-surface text-muted"
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
