/**
 * The toy laptop's keyboard: a Latin American layout measured in key units
 * (a letter key is 1 by 1), and the keys a change in the typed text presses,
 * so the key that moves is the one the candidate pressed.
 */

/** One key on the board, placed in key units from the board's back left corner. */
export interface BoardKey {
  /** What the cap shows: a character, a word like "shift", or a glyph: "backspace", "space", "left", "up", "down", "right". */
  label: string;
  /** Centre, across. */
  x: number;
  /** Centre, front to back. */
  z: number;
  /** Size across and front to back. */
  w: number;
  d: number;
  /** A cap with a colour of its own. */
  accent?: "enter" | "space" | undefined;
}

interface Spec {
  label: string;
  w?: number;
  /** What it types without a modifier. */
  types?: string;
  accent?: "enter" | "space";
  /** The arrow keys up and down share one column, each half as deep. */
  half?: "top" | "bottom";
}

const typing = (chars: string): Spec[] =>
  [...chars].map((char) => ({ label: char.toUpperCase(), types: char }));

const ROWS: readonly (readonly Spec[])[] = [
  [...typing("|1234567890'"), { label: "backspace", w: 1.5 }],
  [{ label: "tab", w: 1.5, types: "\t" }, ...typing("qwertyuiop´+")],
  [
    { label: "bloq", w: 1.75 },
    ...typing("asdfghjklñ"),
    { label: "enter", w: 1.75, types: "\n", accent: "enter" },
  ],
  [{ label: "shift", w: 2.25 }, ...typing("zxcvbnm,.-"), { label: "shift", w: 1.25 }],
  [
    { label: "fn" },
    { label: "ctrl" },
    { label: "alt", w: 1.25 },
    { label: "space", w: 6, types: " ", accent: "space" },
    { label: "alt gr", w: 1.25 },
    { label: "left" },
    { label: "up", half: "top" },
    { label: "down", half: "bottom" },
    { label: "right" },
  ],
];

/** Every row adds up to this many key units. */
export const BOARD_UNITS = 13.5;
export const BOARD_ROWS = ROWS.length;

const keys: BoardKey[] = [];
const byChar = new Map<string, number>();
ROWS.forEach((row, r) => {
  let right = 0;
  for (const spec of row) {
    const w = spec.w ?? 1;
    if (spec.half !== "bottom") right += w;
    for (const char of spec.types ?? "") byChar.set(char, keys.length);
    keys.push({
      label: spec.label,
      x: right - w / 2,
      z: r + (spec.half === "top" ? 0.25 : spec.half === "bottom" ? 0.75 : 0.5),
      w,
      d: spec.half ? 0.5 : 1,
      accent: spec.accent,
    });
  }
});

export const KEYS: readonly BoardKey[] = keys;

/** Keys that type a letter: what a keystroke presses when nothing on the board types it. */
export const LETTER_KEYS: readonly number[] = keys.flatMap((key, i) =>
  /^\p{L}$/u.test(key.label) ? [i] : [],
);

const at = (label: string): number => keys.findIndex((key) => key.label === label);
const SHIFT = at("shift");
const ALT_GR = at("alt gr");
const BACKSPACE = at("backspace");
const ACUTE = at("´");

/** Characters typed with Shift, mapped to the key's own character. */
const SHIFTED: Readonly<Record<string, string>> = {
  "!": "1",
  '"': "2",
  "#": "3",
  $: "4",
  "%": "5",
  "&": "6",
  "/": "7",
  "(": "8",
  ")": "9",
  "=": "0",
  "?": "'",
  "°": "|",
  "*": "+",
  "¨": "´",
  ";": ",",
  ":": ".",
  _: "-",
};

/** Characters typed with Alt Gr, mapped to the key's own character. */
const ALTERED: Readonly<Record<string, string>> = { "@": "q" };

const withShift = (chord: number[]): number[] => (chord.length > 0 ? [SHIFT, ...chord] : []);

/** The keys that type `char`, modifiers first; empty when no key on the board types it. */
function chord(char: string): number[] {
  const own = byChar.get(char);
  if (own !== undefined) return [own];
  const lower = char.toLowerCase();
  if (lower !== char) return withShift(chord(lower));
  // An accented vowel is the accent key, then the vowel.
  const vowel = byChar.get(char.normalize("NFD").replace(/[̀-ͯ]/g, ""));
  if (vowel !== undefined) return [ACUTE, vowel];
  const shifted = byChar.get(SHIFTED[char] ?? "");
  if (shifted !== undefined) return [SHIFT, shifted];
  const altered = byChar.get(ALTERED[char] ?? "");
  return altered === undefined ? [] : [ALT_GR, altered];
}

/**
 * The keys pressed to turn `before` into `after`, as indices into `KEYS`:
 * Backspace when text went away, otherwise the keys that type the first new
 * character. Empty when no key on the board types it.
 */
export function keysFor(before: string, after: string): number[] {
  if (after.length < before.length) return [BACKSPACE];
  let i = 0;
  while (i < before.length && before[i] === after[i]) i++;
  const char = after[i];
  return char === undefined ? [] : chord(char);
}
