"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

import { BOARD_ROWS, BOARD_UNITS, KEYS, LETTER_KEYS, keysFor, type BoardKey } from "./keyboard";
import {
  candy,
  pageFont,
  panel,
  roundedBox,
  roundedRect,
  slab,
  useCanvasTexture,
  useCaret,
  useFontsReady,
  usePrefersStill,
  usePulse,
  wrapText,
  ToyCanvas,
  type ToyProfile,
  type ToyProps,
} from "./studio";

/**
 * "Portátil": a toy laptop in glossy porcelain. Idle, it naps with the lid
 * ajar and shows the stickers on its back. Clicked, it turns around, springs
 * the lid open and types on its screen what the candidate writes, pressing
 * the same keys they press.
 */

/**
 * Every colour the laptop wears, named for the part it paints: a warm
 * porcelain shell, with brand purple and mint only where something happens.
 */
const COLORS = {
  /** The shell: base, lid, the screen's bezel and the hinge's long barrel. */
  body: "#ece4d8",
  /** The hinge's two end knuckles. */
  knuckles: "#cfc6b9",
  /** Every keycap without a colour of its own, and what the caps say. */
  keys: "#cfc6b9",
  legend: "#1d2733",
  /** The spacebar, and the crescent moon on it. */
  spacebar: "#7c00ff",
  spaceLegend: "#ffffff",
  /** Enter, and the word on it. */
  enterKey: "#9ee4b8",
  enterLegend: "#1a324c",
  /** A pressed key flashes one of these, picked at random. */
  flash: ["#9748ff", "#9ee4b8", "#f1c873"],
  trackpad: "#d8cfc2",
  /** Anything that is a hole: the ports and the camera. */
  holes: "#2b313b",
  /** The status light on the front edge; it dims while the laptop naps. */
  light: "#9748ff",
  /** The screen's glass: a gradient from its top left corner to its bottom right, and a glow at the top right. */
  screenTop: "#16283f",
  screenBottom: "#1e1a44",
  screenGlow: "#7c00ff",
  /** On the screen: the typed text, the prompt line, the placeholder (at 55% opacity), the caret, the window dots. */
  screenText: "#ffffff",
  prompt: "#9ee4b8",
  hint: "#d1d5de",
  caret: "#9748ff",
  dots: ["#9748ff", "#f1c873", "#9ee4b8"],
  /** The name sticker: paper, header band, "HOLA, SOY", the name and the role under it. */
  tagPaper: "#fdfbff",
  tagBand: "#7c00ff",
  tagBandText: "#ffffff",
  tagName: "#1a324c",
  tagRole: "#2f3a46",
  /** Its completeness bar: the track (at 45% opacity), the fill and the percentage. */
  barTrack: "#c0a5f4",
  barFill: "#7c00ff",
  barText: "#1a324c",
  /** The puffy stickers, and the smiley's eyes and mouth. */
  heartSticker: "#7c00ff",
  starSticker: "#f3c44f",
  dotSticker: "#9ee4b8",
  smileyInk: "#1a324c",
} as const;
type LaptopColors = typeof COLORS;

const W = 2.7; // base and lid share this footprint
const D = 1.7;
const CORNER = 0.22; // the footprint's corners
const BASE_T = 0.2;
const DECK = BASE_T / 2; // the top of the base, where the keys sit
const LID_T = 0.12;
const HINGE_R = 0.065;
const HINGE_Y = DECK + 0.01; // the hinge's axis, which the lid turns on, at the back edge
const HINGE_Z = -D / 2 + 0.02;
const BARREL = 1.9; // the hinge's long middle barrel, end to end
const LID_GAP = 0.07; // from the axis to the closed lid's underside: it clears the keys
const LID_START = 0.075; // the lid starts past the barrel, so the barrel shows
const LID_D = 1.6;
const LID_Z = LID_START + LID_D / 2; // the lid's centre, from the axis along the lid
const U = 2.34 / BOARD_UNITS; // one key unit
const CAP_GAP = 0.024;
const CAP_H = 0.08;
const KEY_Y = DECK + 0.025; // a cap's centre: it stands 0.065 proud of the deck
const BOARD_Z = -D / 2 + 0.17; // the keyboard's back edge
const PRESS = 0.035;
const PAD_W = 1.1;
const PAD_D = 0.42;
const PAD_Z = BOARD_Z + BOARD_ROWS * U + 0.075 + PAD_D / 2;
const SCREEN_W = 2.4;
const SCREEN_H = 1.3;
const SCREEN_Z = LID_START + 0.16 + SCREEN_H / 2; // a deeper bezel below the screen than above it
const TAG_W = 1.6;
const TAG_H = TAG_W * (320 / 680); // the tag's canvas proportions
const TAG_LIFT = 0.016; // the tag's face, above the lid
const ATLAS_COLS = 8; // the legend atlas is this many cells across and down
const CELL = 128;
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const PROMPT = "hola@moonlight:~$";
const HINT = "Escribe tu nombre";
const HINT_AFTER_PROMPT = "Escribe aquí"; // the prompt already says what to write

interface Pose {
  turn: number;
  tilt: number;
  open: number;
  y: number;
  scale: number;
}
// Idle it shows its back; writing, it faces the camera from a little above, lid at 114°.
// Sized so that even mid-turn it fits a stage narrower than it is tall.
const IDLE: Pose = { turn: Math.PI - 0.62, tilt: 0.5, open: 0.26, y: -0.18, scale: 1.06 };
const WRITE: Pose = {
  turn: -0.16, // a three-quarter view: the right side shows
  tilt: 0.62,
  open: THREE.MathUtils.degToRad(114),
  y: -0.69,
  scale: 1,
};
const FACING = 0.6; // how close to facing the camera, in radians, before the lid opens

/** Puffy stickers on the lid, placed as seen from behind: u to the right, v up, from the lid's centre. */
const STICKERS = [
  { shape: "heart", u: -1.03, v: 0.3, angle: 0.18 },
  { shape: "star", u: 0.98, v: 0.48, angle: -0.15 },
  { shape: "dot", u: 1.02, v: -0.28, angle: 0.25 },
] as const;
const TAG_AT = { u: -0.05, v: -0.08, angle: 0.04 };

/** Where each key sits on the deck, and the size of its cap. */
const BOARD = KEYS.map((key) => ({
  key,
  x: (key.x - BOARD_UNITS / 2) * U,
  z: BOARD_Z + key.z * U,
  w: key.w * U - CAP_GAP,
  d: key.d * U - CAP_GAP,
}));

const capColor = (colors: LaptopColors, key: BoardKey): string =>
  key.accent === "enter" ? colors.enterKey : key.accent === "space" ? colors.spacebar : colors.keys;

/** The palette as three.js colours: what the keys, the screen and the light animate between. */
function tintsOf(colors: LaptopColors) {
  const screenOn = new THREE.Color("#ffffff");
  return {
    rest: KEYS.map((key) => new THREE.Color(capColor(colors, key))),
    flash: colors.flash.map((color) => new THREE.Color(color)),
    light: new THREE.Color(colors.light),
    screenOn,
    screenOff: screenOn.clone().multiplyScalar(0.18),
  };
}

const TINTS = tintsOf(COLORS);

interface Spring {
  x: number;
  v: number;
}
interface Key extends Spring {
  /** The colour it flashed when last pressed, fading back to rest as `glow` drops. */
  tint: THREE.Color | null;
  glow: number;
}

/** Moves a spring one frame towards `target`; light damping lets it overshoot. */
function step(
  s: Spring,
  target: number,
  delta: number,
  stiffness: number,
  damping: number,
  still: boolean,
): void {
  if (still) {
    s.x = target;
    s.v = 0;
    return;
  }
  // Small fixed steps keep it stable and on time even when frames are slow.
  for (let left = Math.min(delta, 0.1); left > 0; left -= 1 / 60) {
    const dt = Math.min(left, 1 / 60);
    s.v += (stiffness * (target - s.x) - damping * s.v) * dt;
    s.x += s.v * dt;
  }
}

const createMotion = () => ({
  open: { x: IDLE.open, v: 0 },
  turn: { x: IDLE.turn, v: 0 },
  tilt: { x: IDLE.tilt, v: 0 },
  y: { x: IDLE.y, v: 0 },
  scale: { x: IDLE.scale, v: 0 },
  pop: { x: 1, v: 0 }, // the screen text, per key
  light: 0,
  lean: { x: 0, y: 0 }, // towards the pointer while it is over the stage
  keys: KEYS.map((): Key => ({ x: 0, v: 0, tint: null, glow: 0 })),
});

function heart(s: number): THREE.Shape {
  return new THREE.Shape()
    .moveTo(0, -0.9 * s)
    .bezierCurveTo(-0.35 * s, -0.55 * s, -s, -0.25 * s, -s, 0.25 * s)
    .bezierCurveTo(-s, 0.7 * s, -0.45 * s, 0.95 * s, 0, 0.55 * s)
    .bezierCurveTo(0.45 * s, 0.95 * s, s, 0.7 * s, s, 0.25 * s)
    .bezierCurveTo(s, -0.25 * s, 0.35 * s, -0.55 * s, 0, -0.9 * s);
}

/** A five-point star with every corner rounded off, so it looks soft. */
function star(outer: number, inner: number): THREE.Shape {
  const at = (i: number): [number, number] => {
    const r = i % 2 ? inner : outer;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    return [Math.cos(a) * r, Math.sin(a) * r];
  };
  const mid = (i: number): [number, number] => {
    const [x, y] = at(i);
    const [u, v] = at(i + 1);
    return [(x + u) / 2, (y + v) / 2];
  };
  const shape = new THREE.Shape().moveTo(...mid(0));
  for (let i = 1; i <= 10; i++) shape.quadraticCurveTo(...at(i), ...mid(i));
  return shape;
}

/** A puffy sticker: the shape extruded thin, its edges rounded into a soft dome. */
const STICKER_T = 0.04;
const puffy = (shape: THREE.Shape): THREE.ExtrudeGeometry =>
  new THREE.ExtrudeGeometry(shape, {
    depth: 0.01,
    bevelEnabled: true,
    bevelThickness: STICKER_T,
    bevelSize: STICKER_T * 0.9,
    bevelSegments: 8,
    curveSegments: 32,
  });

// The smiley on the mint dot, in the sticker's own units: its flat top has a
// radius of 0.17. Seen from above, the lid squashes it, so the eyes are tall
// and sit well clear of the mouth, an arc centred at the bottom.
const EYE = { x: 0.06, y: 0.07, r: 0.026 };
const SMILE = { r: 0.08, tube: 0.017, arc: 0.7 * Math.PI, y: -0.005 };
/** Where the arc ends, either side: a bead there rounds off the cut tube. */
const SMILE_END = {
  x: SMILE.r * Math.sin(SMILE.arc / 2),
  y: SMILE.y - SMILE.r * Math.cos(SMILE.arc / 2),
};

/** The raised porcelain lip around the screen: a rounded ring. */
function bezel(lip: number): THREE.ExtrudeGeometry {
  const ring = roundedRect(SCREEN_W + 2 * lip, SCREEN_H + 2 * lip, 0.1 + lip);
  ring.holes.push(roundedRect(SCREEN_W, SCREEN_H, 0.1));
  return new THREE.ExtrudeGeometry(ring, {
    depth: 0.006,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 4,
    curveSegments: 24,
  });
}

const LABELS = [...new Set(KEYS.map((key) => key.label))];
const ARROWS: Readonly<Record<string, number>> = {
  up: 0,
  right: Math.PI / 2,
  down: Math.PI,
  left: -Math.PI / 2,
};

/** A key's legend, centred on the origin, in the colour already set. */
function drawLegend(ctx: CanvasRenderingContext2D, label: string, font: string): void {
  const turn = ARROWS[label];
  if (turn !== undefined) {
    ctx.rotate(turn);
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(18, 13);
    ctx.lineTo(-18, 13);
    ctx.closePath();
    ctx.fill();
    return;
  }
  if (label === "backspace") {
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.lineTo(-28, 0);
    ctx.moveTo(-10, -18);
    ctx.lineTo(-28, 0);
    ctx.lineTo(-10, 18);
    ctx.stroke();
    return;
  }
  if (label === "space") {
    // A crescent moon: a disc with a smaller one taken out of its top right.
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(13, -9, 25, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  // Words are squeezed to their cell rather than spill into the next legend.
  ctx.font = `900 ${label.length === 1 ? 86 : 46}px ${font}`;
  ctx.fillText(label, 0, 4, CELL - 14);
}

/** Every legend once, one per cell: the keys cut their own out of it. */
function drawLegends(ctx: CanvasRenderingContext2D, colors: LaptopColors): void {
  const font = pageFont();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  LABELS.forEach((label, i) => {
    ctx.save();
    ctx.translate(((i % ATLAS_COLS) + 0.5) * CELL, (Math.floor(i / ATLAS_COLS) + 0.5) * CELL);
    const ink =
      label === "enter"
        ? colors.enterLegend
        : label === "space"
          ? colors.spaceLegend
          : colors.legend;
    ctx.fillStyle = ink;
    ctx.strokeStyle = ink;
    drawLegend(ctx, label, font);
    ctx.restore();
  });
}

/** A square decal `size` across showing `label`, cut from the legend atlas. */
function legendDecal(label: string, size: number): THREE.PlaneGeometry {
  const cell = LABELS.indexOf(label);
  const col = cell % ATLAS_COLS;
  const row = Math.floor(cell / ATLAS_COLS);
  const geometry = new THREE.PlaneGeometry(size, size);
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (col + uv.getX(i)) / ATLAS_COLS, 1 - (row + 1 - uv.getY(i)) / ATLAS_COLS);
  }
  return geometry;
}

/** The screen's glass: a navy gradient with a purple glow, the window dots and a glare. */
function drawGlass(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: LaptopColors,
): void {
  const fill = ctx.createLinearGradient(0, 0, w * 0.35, h);
  fill.addColorStop(0, colors.screenTop);
  fill.addColorStop(1, colors.screenBottom);
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(w * 0.85, h * 0.1, 0, w * 0.85, h * 0.1, w * 0.55);
  glow.addColorStop(0, colors.screenGlow);
  glow.addColorStop(1, "rgba(124, 0, 255, 0)");
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // A soft diagonal band across the top right, like light caught on glass.
  ctx.save();
  ctx.translate(w * 0.8, 0);
  ctx.rotate(0.55);
  const glare = ctx.createLinearGradient(-70, 0, 70, 0);
  glare.addColorStop(0, "rgba(255, 255, 255, 0)");
  glare.addColorStop(0.5, "rgba(255, 255, 255, 1)");
  glare.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = glare;
  ctx.fillRect(-70, -h, 140, h * 3);
  ctx.restore();
  ctx.globalAlpha = 1;

  colors.dots.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(76 + i * 44, 60, 14, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** A block caret for a line `size` px tall whose top is at `y`. */
function caretBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y + size * 0.12, size * 0.5, size * 0.84, size * 0.08);
  ctx.fill();
}

/** Splits a line still wider than `room` letter by letter. */
function splitLetters(ctx: CanvasRenderingContext2D, line: string, room: number): string[] {
  const parts = [""];
  for (const letter of line) {
    const last = parts[parts.length - 1] ?? "";
    if (last && ctx.measureText(last + letter).width > room) parts.push(letter);
    else parts[parts.length - 1] = last + letter;
  }
  return parts;
}

type Layout = (ctx: CanvasRenderingContext2D, text: string, room: number) => string[];

// Tried in order, each from its biggest size to its smallest: one big line,
// then wrapped by words, and only then with long words split by letters.
const LAYOUTS: ReadonlyArray<readonly [number, number, Layout]> = [
  [200, 120, (_, text) => [text]],
  [156, 76, (ctx, text, room) => wrapText(ctx, text, room)],
  [
    156,
    44,
    (ctx, text, room) => wrapText(ctx, text, room).flatMap((line) => splitLetters(ctx, line, room)),
  ],
];

/** The biggest size, and its lines, at which `text` and its caret fit `width` by `height`. */
function fitText(ctx: CanvasRenderingContext2D, text: string, width: number, height: number) {
  const font = pageFont();
  for (const [biggest, smallest, layout] of LAYOUTS) {
    for (let size = biggest; size >= smallest; size -= 4) {
      ctx.font = `900 ${size}px ${font}`;
      const room = width - size * 0.6;
      const lines = layout(ctx, text, room);
      const fits = lines.every((line) => ctx.measureText(line).width <= room);
      if (fits && lines.length * size * 1.05 <= height) return { size, lines };
    }
  }
  return { size: 44, lines: [text] };
}

/** The words on the lit screen: the prompt and any `command`, then the typed text as big as it fits. */
function drawWords(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: LaptopColors,
  text: string,
  caret: boolean,
  command: string,
): void {
  const pad = 64;
  const font = pageFont();
  const maxWidth = w - pad * 2;
  const typed = text.trim();
  const hint = command ? HINT_AFTER_PROMPT : HINT;
  const { size, lines } = typed
    ? fitText(ctx, typed, maxWidth, h - 250)
    : { size: 96, lines: [hint] };

  // The prompt and the text sit together in the middle, under the dots.
  const y = 100 + Math.max(0, (h - 250 - lines.length * size * 1.05) / 2);
  // With a field to show, the prompt shrinks to "~$" so the field's name can be big enough to read.
  const prompt = command ? "~$" : PROMPT;
  ctx.fillStyle = colors.prompt;
  ctx.font = `700 ${command ? 68 : 54}px ${MONO}`;
  ctx.fillText(prompt, pad, y + 56);
  if (command) {
    const x = pad + ctx.measureText(`${prompt} `).width;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = colors.screenText;
    ctx.fillText(command, x, y + 56, pad + maxWidth - x);
    ctx.globalAlpha = 1;
  }
  const top = y + 112;
  ctx.font = `900 ${size}px ${font}`;
  if (!typed) {
    if (caret) caretBlock(ctx, pad, top, size, colors.caret);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = colors.hint;
    ctx.fillText(hint, pad + size * 0.64, top + size * 0.9, maxWidth - size);
    ctx.globalAlpha = 1;
    return;
  }
  // Leave room for the caret; a word too long even at the smallest size is squeezed.
  const room = maxWidth - size * 0.6;
  ctx.fillStyle = colors.screenText;
  lines.forEach((line, i) => ctx.fillText(line, pad, top + size * (0.9 + i * 1.05), room));
  if (caret) {
    const last = lines[lines.length - 1] ?? "";
    const trailing = text.endsWith(" ") ? ctx.measureText(" ").width : 0;
    const end = Math.min(ctx.measureText(last).width + trailing, room);
    caretBlock(
      ctx,
      pad + end + size * 0.06,
      top + size * 1.05 * Math.max(0, lines.length - 1),
      size,
      colors.caret,
    );
  }
}

/** The "HOLA, SOY" name sticker on the back of the lid. */
function drawTag(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: LaptopColors,
  profile: ToyProfile,
): void {
  const font = pageFont();
  const band = 76;
  ctx.fillStyle = colors.tagPaper;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = colors.tagBand;
  ctx.fillRect(0, 0, w, band);

  ctx.textAlign = "center";
  ctx.fillStyle = colors.tagBandText;
  ctx.font = `900 44px ${font}`;
  ctx.fillText("HOLA, SOY", w / 2, 55);

  const name = profile.fullName.trim() || "Tu nombre";
  let size = 88;
  ctx.font = `900 ${size}px ${font}`;
  while (size > 48 && ctx.measureText(name).width > w - 60) {
    size -= 4;
    ctx.font = `900 ${size}px ${font}`;
  }
  ctx.fillStyle = colors.tagName;
  ctx.fillText(name, w / 2, band + 16 + size * 0.8, w - 60);

  const role = profile.role.trim() || profile.skills.slice(0, 3).join(" · ");
  ctx.fillStyle = colors.tagRole;
  ctx.font = `900 38px ${font}`;
  ctx.fillText(role, w / 2, band + 142, w - 80);

  // Completeness, as a little bar with its percentage.
  const pct = Math.max(0, Math.min(100, Math.round(profile.completeness)));
  const barX = 56;
  const barW = w - 210;
  ctx.fillStyle = colors.barTrack;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.roundRect(barX, h - 62, barW, 26, 13);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.barFill;
  ctx.beginPath();
  ctx.roundRect(barX, h - 62, Math.max(26, (barW * pct) / 100), 26, 13);
  ctx.fill();
  ctx.textAlign = "right";
  ctx.fillStyle = colors.barText;
  ctx.font = `900 40px ${font}`;
  ctx.fillText(`${pct}%`, w - 52, h - 34);
}

interface LaptopToyProps extends ToyProps {
  /** What the prompt asks for, like "nombre"; the empty screen then reads "Escribe aquí". */
  prompt?: string | undefined;
}

function LaptopToy({ text, writing, keystrokes, profile, onActivate, prompt }: LaptopToyProps) {
  const still = usePrefersStill();
  const caret = useCaret(writing);
  const pulse = usePulse(keystrokes);
  const fonts = useFontsReady();
  const [motion] = useState(createMotion);
  const command = prompt?.trim() ?? "";
  const screenPx = [1024, Math.round((1024 * SCREEN_H) / SCREEN_W)] as const;

  const glassTexture = useCanvasTexture(
    ...screenPx,
    (ctx, w, h) => drawGlass(ctx, w, h, COLORS),
    [],
  );
  const wordsTexture = useCanvasTexture(
    ...screenPx,
    (ctx, w, h) => drawWords(ctx, w, h, COLORS, text, caret, command),
    [text, caret, command, fonts],
  );
  const legendTexture = useCanvasTexture(
    ATLAS_COLS * CELL,
    ATLAS_COLS * CELL,
    (ctx) => drawLegends(ctx, COLORS),
    [fonts],
  );
  const tagTexture = useCanvasTexture(
    680,
    320,
    (ctx, w, h) => drawTag(ctx, w, h, COLORS, profile),
    [profile.fullName, profile.role, profile.completeness, profile.skills.join(), fonts],
  );

  const geometry = useMemo(() => {
    // Keys of one size share a cap, and keys with one legend at one size share a decal.
    const shared = new Map<string, THREE.BufferGeometry>();
    const once = (id: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry => {
      const made = shared.get(id) ?? make();
      shared.set(id, made);
      return made;
    };
    const keys = BOARD.map(({ key, w, d }) => ({
      cap: once(`cap ${w} ${d}`, () => roundedBox(w, CAP_H, d, 0.03, 4)),
      decal: once(`${key.label} ${Math.min(w, d)}`, () => legendDecal(key.label, Math.min(w, d))),
    }));
    const tag = new THREE.ExtrudeGeometry(roundedRect(TAG_W, TAG_H, 0.1), {
      depth: 0.004,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 5,
      curveSegments: 24,
    });
    const parts = {
      base: slab(W, BASE_T, D, CORNER, 0.07),
      lid: slab(W, LID_T, LID_D, CORNER, 0.05),
      barrel: new THREE.CapsuleGeometry(HINGE_R, BARREL - 2 * HINGE_R, 8, 32).rotateZ(Math.PI / 2),
      knuckle: new THREE.CapsuleGeometry(HINGE_R * 0.97, 0.074, 8, 32).rotateZ(Math.PI / 2),
      bezel: bezel(0.06),
      screen: panel(SCREEN_W, SCREEN_H, 0.1),
      camera: new THREE.SphereGeometry(0.022, 20, 12),
      trackpad: slab(PAD_W, 0.012, PAD_D, 0.07, 0.005),
      led: new THREE.CapsuleGeometry(0.016, 0.07, 6, 16).rotateZ(Math.PI / 2),
      port: new THREE.CapsuleGeometry(0.012, 0.045, 6, 12).rotateX(Math.PI / 2),
      jack: new THREE.CylinderGeometry(0.017, 0.017, 0.02, 20).rotateZ(Math.PI / 2),
      tag,
      tagFace: panel(TAG_W, TAG_H, 0.1),
      heart: puffy(heart(0.24)),
      star: puffy(star(0.27, 0.13)),
      dot: puffy(new THREE.Shape().absarc(0, 0, 0.17, 0, Math.PI * 2, false)),
      eye: new THREE.SphereGeometry(EYE.r, 20, 14),
      smile: new THREE.TorusGeometry(SMILE.r, SMILE.tube, 10, 40, SMILE.arc),
      smileEnd: new THREE.SphereGeometry(SMILE.tube, 16, 12),
    };
    return { keys, parts, all: [...shared.values(), ...Object.values(parts)] };
  }, []);
  useEffect(
    () => () => {
      for (const shape of geometry.all) shape.dispose();
    },
    [geometry],
  );

  // Painted from the palette once, and disposed with the laptop.
  const kit = useMemo(() => {
    const gloss = { roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12, sheen: 0 };
    const material = {
      body: candy(COLORS.body, gloss),
      knuckles: candy(COLORS.knuckles, gloss),
      trackpad: candy(COLORS.trackpad, {
        roughness: 0.35,
        clearcoat: 0.6,
        clearcoatRoughness: 0.3,
      }),
      holes: candy(COLORS.holes, { roughness: 0.35, sheen: 0 }),
      legend: new THREE.MeshStandardMaterial({
        map: legendTexture,
        transparent: true,
        depthWrite: false,
        roughness: 0.55,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -4,
      body: candy(COLORS.body),
      key: candy("#ffffff"), // white, so each keycap shows its own instance colour
      spacebar: candy(COLORS.spacebar),
      trackpad: candy(COLORS.trackpad),
      hinges: candy(COLORS.hinges),
      heart: candy(COLORS.heartSticker),
      star: candy(COLORS.starSticker),
      dot: candy(COLORS.dotSticker),
      smiley: candy(COLORS.smileyInk),
      light: new THREE.MeshBasicMaterial({ color: TINTS.light, toneMapped: false }),
      screen: new THREE.MeshBasicMaterial({ color: TINTS.screenOff, toneMapped: false }),
      words: new THREE.MeshBasicMaterial({
        map: screenTexture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      }),
      tag: new THREE.MeshBasicMaterial({
        map: tagTexture,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    };
    const keys = new THREE.InstancedMesh(geometry.key, material.key, SPACE);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < SPACE; i++) {
      dummy.position.set(keyX(i), KEY_Y, keyZ(i));
      dummy.updateMatrix();
      keys.setMatrixAt(i, dummy.matrix);
      keys.setColorAt(i, restOf(TINTS, i));
    }
    return { material, keys, dummy, tint: new THREE.Color() };
  }, [geometry, screenTexture, tagTexture]);

  useEffect(
    () => () => {
      for (const material of Object.values(kit.material)) material.dispose();
      kit.keys.dispose();
    },
    [kit],
  );

  const hovered = useRef(false);
  const hover = (on: boolean): void => {
    hovered.current = on;
    document.body.style.cursor = on ? "pointer" : "";
  };
  useEffect(
    () => () => {
      if (hovered.current) document.body.style.cursor = "";
    },
    [],
  );

  // Every keystroke presses a key: the spacebar for a space, any other key otherwise.
  const seenKeystrokes = useRef(keystrokes);
  useEffect(() => {
    if (keystrokes === seenKeystrokes.current) return;
    seenKeystrokes.current = keystrokes;
    let i = text.endsWith(" ") ? SPACE : Math.floor(Math.random() * SPACE);
    if (i === motion.lastKey && i !== SPACE) i = (i + 1 + Math.floor(Math.random() * 10)) % SPACE;
    motion.lastKey = i;
    const key = motion.keys[i];
    if (!key) return;
    key.x = 1;
    key.v = 0;
    key.glow = 1.6; // above 1 so the colour holds for a beat before it fades
    key.tint = TINTS.flash[Math.floor(Math.random() * TINTS.flash.length)] ?? null;
  }, [keystrokes, text, motion]);

  // A happy little hop whenever it turns, either way.
  const seenWriting = useRef(writing);
  useEffect(() => {
    if (writing === seenWriting.current) return;
    seenWriting.current = writing;
    motion.y.v += 2.6;
  }, [writing, motion]);

  const root = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const turn = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const words = useRef<THREE.Mesh>(null);
  const spacebar = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!root.current || !tilt.current || !turn.current || !lid.current) return;
    if (!words.current || !spacebar.current) return;
    const pose = writing ? WRITE : IDLE;
    const breath = still || writing ? 0 : Math.sin(state.clock.elapsedTime * 1.6);

    step(motion.turn, pose.turn + breath * 0.04, delta, 50, 9.5, still);
    step(motion.tilt, pose.tilt, delta, 50, 9.5, still);
    step(motion.y, pose.y + breath * 0.03, delta, 70, 8, still);
    step(motion.scale, pose.scale, delta, 70, 10, still);
    // It turns to face you first, then the lid springs open: an open lid swinging round leaves the frame.
    const facing = writing && Math.abs(motion.turn.x - WRITE.turn) < FACING;
    step(motion.open, (facing ? WRITE : IDLE).open + breath * 0.05, delta, 110, 11, still);
    if (motion.open.x < 0) {
      // The closing lid taps the base and bounces.
      motion.open.x = 0;
      motion.open.v *= -0.35;
    }
    const lit = writing && motion.open.x > 1.1 ? 1 : 0;
    motion.light = still ? lit : THREE.MathUtils.damp(motion.light, lit, 6, delta);

    const pop = still ? 0 : pulse.current;
    step(motion.pop, 1 + 0.1 * pop, delta, 320, 14, still);
    const s = motion.scale.x;
    root.current.position.y = motion.y.x;
    root.current.scale.set(s * (1 + 0.015 * pop), s * (1 - 0.025 * pop), s * (1 + 0.015 * pop));
    tilt.current.rotation.x = motion.tilt.x;
    turn.current.rotation.y = motion.turn.x;
    lid.current.rotation.x = -motion.open.x;
    words.current.scale.setScalar(motion.pop.x);

    const { material } = kit;
    material.screen.color.copy(TINTS.screenOff).lerp(TINTS.screenOn, motion.light);
    material.words.opacity = motion.light;
    material.light.color.copy(TINTS.light).multiplyScalar(writing ? 1 : 0.6 + 0.25 * breath);

    let dirty = false;
    for (let i = 0; i <= SPACE; i++) {
      const key = motion.keys[i];
      if (!key || (key.x === 0 && key.v === 0 && key.glow === 0)) continue;
      step(key, 0, delta, 200, 11, still);
      key.glow = THREE.MathUtils.damp(key.glow, 0, 4, delta);
      if (Math.abs(key.x) < 1e-3 && Math.abs(key.v) < 1e-2) {
        key.x = 0;
        key.v = 0;
      }
      if (key.glow < 0.01) key.glow = 0;
      kit.tint.copy(restOf(TINTS, i));
      if (key.tint) kit.tint.lerp(key.tint, Math.min(1, key.glow));
      const y = KEY_Y - key.x * PRESS;
      if (i === SPACE) {
        spacebar.current.position.y = y;
        material.spacebar.color.copy(kit.tint);
        continue;
      }
      kit.dummy.position.set(keyX(i), y, keyZ(i));
      kit.dummy.updateMatrix();
      kit.keys.setMatrixAt(i, kit.dummy.matrix);
      kit.keys.setColorAt(i, kit.tint);
      dirty = true;
    }
    if (dirty) {
      kit.keys.instanceMatrix.needsUpdate = true;
      if (kit.keys.instanceColor) kit.keys.instanceColor.needsUpdate = true;
    }
  });

  const { material: m } = kit;
  const g = geometry;
  return (
    <group
      ref={root}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (e.delta < 5) onActivate();
      }}
      onPointerOver={() => hover(true)}
      onPointerOut={() => hover(false)}
    >
      <group ref={tilt}>
        <group ref={turn}>
          <mesh geometry={g.base} material={m.body} />
          <primitive object={kit.keys} />
          <mesh
            ref={spacebar}
            geometry={g.spacebar}
            material={m.spacebar}
            position={[0, KEY_Y, keyZ(SPACE)]}
          />
          <mesh
            geometry={g.trackpad}
            material={m.trackpad}
            position={[0, BASE_T / 2, 0.56]}
            rotation={[-Math.PI / 2, 0, 0]}
          />
          <mesh geometry={g.light} material={m.light} position={[0.95, 0, D / 2 - 0.01]} />
          {[-0.85, 0.85].map((x) => (
            <mesh
              key={x}
              geometry={g.hinge}
              material={m.hinges}
              position={[x, HINGE_Y, -D / 2]}
              rotation={[0, 0, Math.PI / 2]}
            />
          ))}
          <group ref={lid} position={[0, HINGE_Y, -D / 2]}>
            <mesh geometry={g.lid} material={m.body} position={[0, LID_T / 2, D / 2]} />
            <mesh
              geometry={g.screen}
              material={m.screen}
              position={[0, -0.004, SCREEN_Z]}
              rotation={[Math.PI / 2, 0, 0]}
            />
            <mesh
              ref={words}
              geometry={g.words}
              material={m.words}
              position={[0, -0.008, SCREEN_Z]}
              rotation={[Math.PI / 2, 0, 0]}
            />
            {/* The back of the lid faces +y; stickers read upright from behind the laptop. */}
            <mesh
              geometry={g.tag}
              material={m.tag}
              position={[0.18, LID_T + 0.004, D / 2 - 0.12]}
              rotation={[-Math.PI / 2, 0, Math.PI + 0.05]}
            />
            {STICKERS.map((sticker) => (
              <group
                key={sticker.shape}
                position={[-sticker.u, LID_T + 0.01, D / 2 + sticker.v]}
                rotation={[-Math.PI / 2, 0, Math.PI + sticker.angle]}
              >
                <mesh geometry={g[sticker.shape]} material={m[sticker.shape]} />
                {sticker.shape === "dot" && (
                  <>
                    <mesh geometry={g.eye} material={m.smiley} position={[-0.055, 0.035, 0.04]} />
                    <mesh geometry={g.eye} material={m.smiley} position={[0.055, 0.035, 0.04]} />
                    <mesh
                      geometry={g.smile}
                      material={m.smiley}
                      position={[0, 0.005, 0.042]}
                      rotation={[0, 0, Math.PI]}
                    />
                  </>
                )}
              </group>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}

/** The laptop on its stage. `Laptop` loads this in the browser only: three.js needs WebGL. */
export default function LaptopScene(props: LaptopToyProps) {
  return (
    <ToyCanvas>
      <LaptopToy {...props} />
    </ToyCanvas>
  );
}
