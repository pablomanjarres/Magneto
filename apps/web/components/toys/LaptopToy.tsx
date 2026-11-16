"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

import {
  candy,
  pageFont,
  roundedBox,
  useCanvasTexture,
  useCaret,
  usePrefersStill,
  usePulse,
  wrapText,
  ToyCanvas,
  type ToyProfile,
  type ToyProps,
} from "./studio";

/**
 * "Portátil": a chunky toy laptop. Idle, it naps with the lid ajar and shows
 * the stickers on its back. Clicked, it turns around, springs the lid open and
 * types on its screen what the candidate writes, a key popping per keystroke.
 */

/** Every colour the laptop wears, named for the part it paints. Values are hex, like "#7c00ff". */
interface LaptopColors {
  /** The shell: base and lid. */
  body: string;
  /** Every keycap without a colour of its own. */
  keys: string;
  /** The spacebar. */
  spacebar: string;
  /** Esc, top left. */
  escKey: string;
  /** Backspace, top right. */
  backspaceKey: string;
  /** Enter, at the end of the third row. */
  enterKey: string;
  /** Both Shifts, at the ends of the bottom row. */
  shiftKeys: string;
  /** A pressed key flashes one of these, picked at random: 3 to 5 colours. */
  flash: readonly string[];
  /** The trackpad. */
  trackpad: string;
  /** The two hinges. */
  hinges: string;
  /** The tiny status light on the front edge; it dims while the laptop naps. */
  light: string;
  /** The screen while lit; unlit, it is this at 45% brightness. */
  screenOn: string;
  /** The typed text, big. */
  screenText: string;
  /** The "hola@moonlight:~$" line. */
  prompt: string;
  /** The placeholder before anything is typed, drawn at 55% opacity. */
  hint: string;
  /** The blinking block caret. */
  caret: string;
  /** The three window dots, left to right. */
  dots: readonly [string, string, string];
  /** The name sticker on the lid. */
  tagPaper: string;
  /** The sticker's header band. */
  tagBand: string;
  /** "HOLA, SOY", on the band. */
  tagBandText: string;
  /** The candidate's name. */
  tagName: string;
  /** Their role, under the name. */
  tagRole: string;
  /** The completeness bar's track, drawn at 45% opacity over the paper. */
  barTrack: string;
  /** The completeness bar's fill. */
  barFill: string;
  /** The percentage beside the bar. */
  barText: string;
  /** The heart sticker. */
  heartSticker: string;
  /** The star sticker. */
  starSticker: string;
  /** The round sticker with a smiley. */
  dotSticker: string;
  /** The smiley's eyes and mouth. */
  smileyInk: string;
}

/** A warm porcelain shell; brand purple and mint only where something happens. */
const COLORS: LaptopColors = {
  body: "#f4f0e9",
  keys: "#84827e",
  spacebar: "#6700d0",
  escKey: "#6700d0",
  backspaceKey: "#73706b",
  enterKey: "#41885f",
  shiftKeys: "#73706b",
  flash: ["#6700d0", "#41885f", "#c59500"],
  trackpad: "#8f8c87",
  hinges: "#8f8c87",
  light: "#9748ff",
  screenOn: "#10233a",
  screenText: "#ffffff",
  prompt: "#9ee4b8",
  hint: "#d1d5de",
  caret: "#9748ff",
  dots: ["#9748ff", "#c89341", "#9ee4b8"],
  tagPaper: "#f3eaff",
  tagBand: "#7c00ff",
  tagBandText: "#ffffff",
  tagName: "#1a324c",
  tagRole: "#47535f",
  barTrack: "#c0a5f4",
  barFill: "#7c00ff",
  barText: "#7c00ff",
  heartSticker: "#6700d0",
  starSticker: "#c59500",
  dotSticker: "#41885f",
  smileyInk: "#001b38",
};

const W = 2.7; // base and lid share this footprint
const D = 1.7;
const BASE_T = 0.3;
const LID_T = 0.16;
const HINGE_Y = BASE_T / 2 + 0.06; // the closed lid clears the keys
const COLS = 11;
const ROWS = 4;
const PITCH = 0.19;
const ROW0 = -0.52;
const SPACE = COLS * ROWS; // the spacebar's index, after the 44 keys
const KEY_Y = BASE_T / 2 + 0.01;
const PRESS = 0.045;
const SCREEN_W = 2.34;
const SCREEN_H = 1.36;
const SCREEN_Z = 0.89; // from the hinge, along the lid
const TAG_W = 1.7;
const TAG_H = 0.8;
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
// Idle it shows its back; writing, it faces the camera with the lid at 105°.
// Sized so that even mid-turn it fits a stage narrower than it is tall.
const IDLE: Pose = { turn: Math.PI - 0.62, tilt: 0.5, open: 0.26, y: -0.4, scale: 0.86 };
const WRITE: Pose = {
  turn: 0,
  tilt: 0.38,
  open: THREE.MathUtils.degToRad(105),
  y: -0.8,
  scale: 0.9,
};
const FACING = 0.6; // how close to facing the camera, in radians, before the lid opens

/** Puffy stickers on the lid, placed as seen from behind: u to the right, v up. */
const STICKERS = [
  { shape: "heart", u: 0.86, v: 0.42, angle: -0.25 },
  { shape: "star", u: -0.95, v: 0.5, angle: 0.2 },
  { shape: "dot", u: 0.92, v: -0.45, angle: 0 },
] as const;

/** The palette as three.js colours: what the keys, the screen and the light animate between. */
function tintsOf(colors: LaptopColors) {
  const shift = new THREE.Color(colors.shiftKeys);
  const screenOn = new THREE.Color(colors.screenOn);
  return {
    keys: new THREE.Color(colors.keys),
    // Keycaps with a colour of their own, by index: Esc, Backspace, Enter, both Shifts, spacebar.
    accents: new Map<number, THREE.Color>([
      [0, new THREE.Color(colors.escKey)],
      [COLS - 1, new THREE.Color(colors.backspaceKey)],
      [3 * COLS - 1, new THREE.Color(colors.enterKey)],
      [3 * COLS, shift],
      [SPACE - 1, shift],
      [SPACE, new THREE.Color(colors.spacebar)],
    ]),
    flash: colors.flash.map((color) => new THREE.Color(color)),
    light: new THREE.Color(colors.light),
    screenOn,
    screenOff: screenOn.clone().multiplyScalar(0.45),
  };
}

const TINTS = tintsOf(COLORS);
type Tints = ReturnType<typeof tintsOf>;

/** The colour key `i` rests at; the spacebar is the last index. */
const restOf = (tints: Tints, i: number): THREE.Color => tints.accents.get(i) ?? tints.keys;

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
  keys: Array.from({ length: SPACE + 1 }, (): Key => ({ x: 0, v: 0, tint: null, glow: 0 })),
  lastKey: -1,
});

const keyX = (i: number): number => ((i % COLS) - (COLS - 1) / 2) * PITCH;
const keyZ = (i: number): number => ROW0 + Math.floor(i / COLS) * PITCH;

function roundedRect(w: number, h: number, r: number): THREE.Shape {
  const x = -w / 2;
  const y = -h / 2;
  return new THREE.Shape()
    .moveTo(x + r, y)
    .lineTo(x + w - r, y)
    .quadraticCurveTo(x + w, y, x + w, y + r)
    .lineTo(x + w, y + h - r)
    .quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    .lineTo(x + r, y + h)
    .quadraticCurveTo(x, y + h, x, y + h - r)
    .lineTo(x, y + r)
    .quadraticCurveTo(x, y, x + r, y);
}

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

const puffy = (shape: THREE.Shape): THREE.ExtrudeGeometry =>
  new THREE.ExtrudeGeometry(shape, {
    depth: 0.01,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.022,
    bevelSegments: 6,
    curveSegments: 32,
  });

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
  [160, 100, (_, text) => [text]],
  [132, 64, (ctx, text, room) => wrapText(ctx, text, room)],
  [
    132,
    36,
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
  return { size: 36, lines: [text] };
}

/** The lit screen: the prompt and any `command`, then the typed text as big as it fits. */
function drawScreen(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: LaptopColors,
  text: string,
  caret: boolean,
  command: string,
): void {
  const pad = 64;
