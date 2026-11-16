import { useId } from "react";

export type LunaMood = "idle" | "happy" | "thinking";

const INK = "#1a324c";
const GOLD = "#f6d27b";
const SHADE = "#e9b458";
const CRATER = "#dfa449";
const CAP = "#7c00ff";
const BAND = "#9748ff";
const MINT = "#9ee4b8";

/** Both eyes come from one master, mirrored around the face's vertical axis at x = 32. */
const EYES = [25, 39] as const;
const EYE_Y = 37;

/** A four-point sparkle of radius r centred on (x, y). */
const sparkle = (x: number, y: number, r: number): string => {
  const k = r * 0.28;
  return `M${x} ${y - r} C${x + k} ${y - k} ${x + k} ${y - k} ${x + r} ${y} C${x + k} ${y + k} ${x + k} ${y + k} ${x} ${y + r} C${x - k} ${y + k} ${x - k} ${y + k} ${x - r} ${y} C${x - k} ${y - k} ${x - k} ${y - k} ${x} ${y - r}Z`;
};

/** A five-point star of outer radius r centred on (x, y), first point straight up. */
const star = (x: number, y: number, r: number): string =>
  Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    return `${i === 0 ? "M" : "L"}${(x + radius * Math.cos(angle)).toFixed(2)} ${(y + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(" ") + "Z";

/**
 * Luna: a little round moon with freckle craters, a purple nightcap and one
 * arm up to wave. Idle she blinks, happy her eyes close into smiles, thinking
 * she looks up with a small round mouth.
 */
export function LunaFace({
  mood = "idle",
  className = "",
}: {
  mood?: LunaMood;
  className?: string;
}) {
  // useId's punctuation would break url(#…) references.
  const body = `luna${useId().replace(/[^\w-]/g, "")}-body`;
  const look = mood === "thinking" ? -1.6 : 0;

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <defs>
        <clipPath id={body}>
          <circle cx="32" cy="37" r="19" />
        </clipPath>
      </defs>

      {/* Feet, then the waving arm behind the body's edge. */}
      <ellipse cx="25" cy="55" rx="5" ry="3.2" fill={SHADE} />
      <ellipse cx="39" cy="55" rx="5" ry="3.2" fill={SHADE} />
      <g className="origin-[48px_37px] motion-safe:group-hover:animate-wiggle">
        <ellipse
          cx="50.5"
          cy="30.5"
          rx="3.3"
          ry="5.2"
          transform="rotate(32 50.5 30.5)"
          fill={GOLD}
        />
        <g stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.9">
          <path d="M55.5 22.5 l1.6 -2.4" />
          <path d="M57.8 25.6 l2.6 -1.3" />
        </g>
      </g>
      <ellipse cx="14.6" cy="44.5" rx="3.2" ry="4.6" transform="rotate(28 14.6 44.5)" fill={GOLD} />

      {/* The moon: flat gold, a soft shade low on the right, a shine and craters. */}
      <circle cx="32" cy="37" r="19" fill={GOLD} />
      <g clipPath={`url(#${body})`}>
        <circle cx="40" cy="45" r="19" fill={SHADE} opacity="0.45" />
      </g>
      <ellipse
        cx="22"
        cy="27"
        rx="3.8"
        ry="2.2"
        transform="rotate(-35 22 27)"
        fill="white"
        opacity="0.5"
      />
      <g fill={CRATER} opacity="0.85">
        <circle cx="45.5" cy="36.5" r="2" />
        <circle cx="40.5" cy="51" r="1.6" />
        <circle cx="21.5" cy="51.5" r="1.3" />
        <circle cx="17.8" cy="35" r="1.5" />
      </g>
      <g fill="#ff9f8a" opacity="0.45">
        <ellipse cx="19.8" cy="44.2" rx="2.8" ry="1.7" />
        <ellipse cx="44.2" cy="44.2" rx="2.8" ry="1.7" />
      </g>

      {/* Nightcap: the dome, its tail flopping left, the band, and a mint star at the tip. */}
      <path
        d="M16.5 25 C17.5 12 26 6.5 35 6.8 C44.5 7.2 50 14 49.5 24 C38 19.5 27 20 16.5 25Z"
        fill={CAP}
      />
      <path
        d="M28 9.5 C18 9 11.5 14.5 9.5 23.5 L13.6 24.6 C15.4 17.5 20.5 13.6 29.4 13.4Z"
        fill={CAP}
      />
      <path
        d="M14.8 24.6 C26.5 18.8 38.5 18.6 50.2 23.4 L50 27.6 C38.5 23.4 27 23.6 15.4 29Z"
        fill={BAND}
      />
      <path
        d={star(10.8, 26, 4.6)}
        fill={MINT}
        stroke="white"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {mood === "happy" ? (
        <g fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round">
          {EYES.map((x) => (
            <path
              key={x}
              d={`M${x - 4} ${EYE_Y + 1.2} Q${x} ${EYE_Y - 4} ${x + 4} ${EYE_Y + 1.2}`}
            />
          ))}
        </g>
      ) : (
        <g className="origin-center [transform-box:fill-box] motion-safe:animate-blink">
          {EYES.map((x) => (
            <g key={x}>
              <ellipse cx={x} cy={EYE_Y} rx="4.4" ry="5.2" fill={INK} />
              <path d={sparkle(x - 1.3, EYE_Y - 1.6 + look, 1.9)} fill="white" />
              <circle cx={x + 1.6} cy={EYE_Y + 2 + look} r="0.8" fill="white" />
            </g>
          ))}
        </g>
      )}

      {mood === "thinking" ? (
        <circle cx="32" cy="46.5" r="1.8" fill="#6b3a24" />
      ) : (
        <path
          d={mood === "happy" ? "M27.5 44 Q32 51.5 36.5 44Z" : "M28.6 44.4 Q32 49.6 35.4 44.4Z"}
          fill="#6b3a24"
          stroke="#6b3a24"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
