"use client";

import dynamic from "next/dynamic";

import { Icon } from "../Icon";
import type { Satellite } from "./MoonScene";

/** The flat moon shown while WebGL loads, and the one that stays if it never does. */
function FlatMoon() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="size-48 rounded-full bg-[radial-gradient(circle_at_70%_35%,#ece8f5,#b8b4c4_45%,#2a1a4a_75%)] shadow-[0_0_80px_10px_rgba(151,72,255,0.45)]" />
    </div>
  );
}

// three.js needs a browser, so the scene never renders on the server.
const MoonScene = dynamic(() => import("./MoonScene"), { ssr: false, loading: FlatMoon });

/** The moon plus the caption that says what it means and what it does. */
export function MoonHero({
  percentage,
  satellites,
  moonHref,
}: {
  percentage: number;
  satellites?: Satellite[];
  moonHref?: string;
}) {
  return (
    <div className="relative h-full">
      <MoonScene percentage={percentage} satellites={satellites} moonHref={moonHref} />
      <p className="pointer-events-none absolute bottom-4 left-1/2 flex w-max max-w-[90%] -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-center text-xs font-bold text-white/85 backdrop-blur">
        <Icon name="moon" size={12} />
        {satellites?.length
          ? "Luna llena = perfil al 100% · Los satélites son tus mejores vacantes"
          : "Luna llena = perfil al 100%"}
      </p>
    </div>
  );
}
