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
  y: -0.9,
  scale: 1.08,
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
  const font = pageFont();
  const maxWidth = w - pad * 2;
  colors.dots.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pad + 12 + i * 44, 60, 14, 0, Math.PI * 2);
    ctx.fill();
  });

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
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, 44);
  ctx.clip();
  ctx.fillStyle = colors.tagPaper;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = colors.tagBand;
  ctx.fillRect(0, 0, w, band);
  ctx.restore();

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
  ctx.font = `700 36px ${font}`;
  ctx.fillText(role, w / 2, band + 140, w - 80);

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
  const [motion] = useState(createMotion);
  const command = prompt?.trim() ?? "";

  const screenTexture = useCanvasTexture(
    1024,
    596,
    (ctx, w, h) => drawScreen(ctx, w, h, COLORS, text, caret, command),
    [text, caret, command],
  );
  const tagTexture = useCanvasTexture(
    680,
    320,
    (ctx, w, h) => drawTag(ctx, w, h, COLORS, profile),
    [profile.fullName, profile.role, profile.completeness, profile.skills.join()],
  );

  const geometry = useMemo(
    () => ({
      base: roundedBox(W, BASE_T, D, 0.12, 8),
      lid: roundedBox(W, LID_T, D, 0.07, 8),
      key: roundedBox(0.16, 0.08, 0.16, 0.035, 6),
      spacebar: roundedBox(0.92, 0.08, 0.16, 0.035, 6),
      hinge: new THREE.CylinderGeometry(0.08, 0.08, 0.5, 32),
      trackpad: puffy(roundedRect(0.8, 0.3, 0.1)),
      light: new THREE.SphereGeometry(0.045, 24, 16),
      screen: new THREE.ShapeGeometry(roundedRect(SCREEN_W, SCREEN_H, 0.14), 12),
      words: new THREE.PlaneGeometry(SCREEN_W, SCREEN_H),
      tag: new THREE.PlaneGeometry(TAG_W, TAG_H),
      heart: puffy(heart(0.24)),
      star: puffy(star(0.27, 0.13)),
      dot: puffy(new THREE.Shape().absarc(0, 0, 0.17, 0, Math.PI * 2, false)),
      eye: new THREE.SphereGeometry(0.024, 16, 12),
      smile: new THREE.TorusGeometry(0.055, 0.013, 8, 24, Math.PI),
    }),
    [],
  );
  useEffect(
    () => () => {
      for (const shape of Object.values(geometry)) shape.dispose();
    },
    [geometry],
  );

  // Painted from the palette once, and disposed with the laptop.
  const kit = useMemo(() => {
    const material = {
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
