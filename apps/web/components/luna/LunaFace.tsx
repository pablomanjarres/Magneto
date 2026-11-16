import { useId } from "react";

export type LunaMood = "idle" | "happy" | "thinking";

/** The two eyes, so each mood draws them once and they blink together. */
const EYES = [
  { x: 19, y: 34 },
  { x: 31, y: 34 },
] as const;

/**
 * Luna: the Moon Light crescent with a face. Idle she blinks, happy her eyes
 * close into smiles, thinking she looks up with a small round mouth.
 */
export function LunaFace({
  mood = "idle",
  className = "",
}: {
  mood?: LunaMood;
  className?: string;
}) {
  // useId's punctuation would break url(#…) references, and the face renders twice at once.
  const id = `luna${useId().replace(/[^\w-]/g, "")}`;
  const gold = `${id}-gold`;
  const bite = `${id}-bite`;

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#f1c873" />
          <stop offset="55%" stopColor="#c89341" />
          <stop offset="100%" stopColor="#a8742c" />
        </linearGradient>
        <mask id={bite}>
          <rect width="64" height="64" fill="white" />
          <circle cx="50" cy="19" r="18" fill="black" />
        </mask>
      </defs>

      <g mask={`url(#${bite})`}>
        <circle cx="31" cy="33" r="27" fill={`url(#${gold})`} />
        {/* A soft shine along the outer edge. */}
        <path
          d="M12 18 A27 27 0 0 0 9 40"
          fill="none"
          stroke="#fff3cf"
          strokeWidth="2.6"
          strokeLinecap="round"
          opacity="0.75"
        />
      </g>

      <g fill="#ff8fa3" opacity="0.7">
        <ellipse cx="13" cy="41" rx="3.6" ry="2.2" />
        <ellipse cx="36" cy="41" rx="3.4" ry="2.1" />
      </g>

      {mood === "happy" ? (
        <g fill="none" stroke="#3b2340" strokeWidth="2.4" strokeLinecap="round">
          {EYES.map((e) => (
            <path
              key={e.x}
              d={`M${e.x - 3.4} ${e.y + 1} Q${e.x} ${e.y - 3.6} ${e.x + 3.4} ${e.y + 1}`}
            />
          ))}
        </g>
      ) : (
        <g className="origin-center [transform-box:fill-box] motion-safe:animate-blink">
          {EYES.map((e) => {
            // Thinking, she glances up and to the side.
            const look = mood === "thinking" ? { x: 1, y: -1.4 } : { x: 0, y: 0 };
            return (
              <g key={e.x}>
                <ellipse cx={e.x} cy={e.y} rx="3.6" ry="4.3" fill="#3b2340" />
                <circle cx={e.x - 1.2 + look.x} cy={e.y - 1.6 + look.y} r="1.5" fill="white" />
                <circle cx={e.x + 1.3 + look.x} cy={e.y + 1.4 + look.y} r="0.7" fill="white" />
              </g>
            );
          })}
        </g>
      )}

      {mood === "thinking" ? (
        <circle cx="25" cy="43" r="1.8" fill="#3b2340" />
      ) : (
        <path
          d={mood === "happy" ? "M21 41 Q25 47 29 41 Z" : "M22 42 Q25 45 28 42"}
          fill={mood === "happy" ? "#e0566f" : "none"}
          stroke="#3b2340"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
