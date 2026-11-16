"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { Profile } from "@moonlight/types";

import { Icon } from "../Icon";

// three.js needs a browser, so the scene never renders on the server. Until it
// loads, the panel behind it is all that shows.
const LaptopScene = dynamic(() => import("./LaptopToy"), { ssr: false });

/**
 * The laptop toy, filling its parent. Idle it shows a sticker on its lid with
 * the candidate's name, the role they want and how complete the profile is;
 * while `writing` it faces them and types `text` on its screen. Clicking it
 * calls `onActivate`, or opens `href`.
 */
export function Laptop({
  profile,
  completeness,
  text = "",
  writing = false,
  keystrokes = 0,
  prompt,
  onActivate,
  href,
  caption,
}: {
  profile: Profile;
  completeness: number;
  text?: string;
  writing?: boolean;
  keystrokes?: number;
  /** The field being typed in, shown after the screen's prompt. */
  prompt?: string | undefined;
  onActivate?: (() => void) | undefined;
  href?: string | undefined;
  /** A line under the laptop that says what clicking it does. */
  caption?: string | undefined;
}) {
  const router = useRouter();
  const activate = onActivate ?? (() => href && router.push(href));

  return (
    <div className="relative h-full">
      <LaptopScene
        profile={{
          fullName: profile.fullName,
          role: profile.expectations.targetRole ?? profile.experience[0]?.title ?? "",
          completeness,
          skills: profile.skills.map((skill) => skill.name),
        }}
        text={text}
        writing={writing}
        keystrokes={keystrokes}
        prompt={prompt}
        onActivate={activate}
      />
      {caption && (
        <p className="pointer-events-none absolute bottom-4 left-1/2 flex w-max max-w-[90%] -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-center text-xs font-bold text-white/85 backdrop-blur">
          <Icon name="sparkles" size={12} />
          {caption}
        </p>
      )}
    </div>
  );
}
