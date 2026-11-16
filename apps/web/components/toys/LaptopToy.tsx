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
