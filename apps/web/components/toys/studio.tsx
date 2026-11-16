"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * The stage the laptop toy stands on: a glossy candy material, soft studio
 * light, the shadow it sits on, and small helpers for text it writes live.
 */

/** Glossy and soft, like icing. Pass overrides for anything that should differ. */
export function candy(
  color: string,
  extra: THREE.MeshPhysicalMaterialParameters = {},
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.42,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
    sheen: 0.4,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color("#ffffff"),
    ...extra,
  });
}

/** A box with soft corners: the basic toy shape. */
export const roundedBox = (
  width: number,
  height: number,
  depth: number,
  radius: number,
  segments = 6,
): THREE.BufferGeometry => new RoundedBoxGeometry(width, height, depth, segments, radius);

/** What the candidate is typing, and who they are, for the toy to write on itself. */
export interface ToyProfile {
  fullName: string;
  role: string;
  completeness: number;
  skills: string[];
}

export interface ToyProps {
  /** What the candidate is typing, written onto the model live. */
  text: string;
  /** True once the model was clicked: it turns around and shows the side it writes on. */
  writing: boolean;
  /** Goes up by one on every keystroke, so the model can react to each key. */
  keystrokes: number;
  profile: ToyProfile;
  /** The model was clicked. */
  onActivate: () => void;
}

/** Soft light from above and a little lilac from behind, plus reflections for the gloss. */
function Studio() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;
    return () => {
      scene.environment = null;
      environment.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  return (
    <>
      <hemisphereLight args={["#fff7ff", "#ffd9ea", 0.9]} />
      <directionalLight position={[3, 5, 4]} intensity={1.5} color="#fffaf2" />
      <directionalLight position={[-4, 2.5, -3]} intensity={0.7} color="#c9b2ff" />
    </>
  );
}

/** A soft round shadow on the floor, so the toy sits on something. */
function SoftShadow({ y = -1.25, size = 2.6, opacity = 0.32 }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(20, 10, 40, 1)");
    g.addColorStop(1, "rgba(20, 10, 40, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={texture} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

/**
 * The stage every toy renders in: camera, light and shadow. Put the model
 * around the origin; about 3 units wide and 2.6 tall fits the frame.
 */
export function ToyCanvas({
  children,
  shadowY = -1.25,
}: {
  children: ReactNode;
  shadowY?: number;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.4, 6], fov: 35 }}
      // The neutral curve keeps a palette true; the default ACES curve greys light colours out.
      gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping }}
      aria-hidden="true"
    >
      <Studio />
      <SoftShadow y={shadowY} />
      {children}
    </Canvas>
  );
}

/** Honours "reduce motion": the toy should hold still and jump to its final pose. */
export function usePrefersStill(): boolean {
  const [still, setStill] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setStill(query.matches);
    const update = (): void => setStill(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return still;
}

/** The font the page uses, for text drawn on canvases. */
export const pageFont = (): string => getComputedStyle(document.body).fontFamily;

/** Splits text into lines that fit `maxWidth` with the context's current font. */
export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * A canvas drawn in 2D and used as a texture, redrawn only when `deps`
 * change. Draw with `draw(ctx, width, height)`; the canvas is cleared first.
 */
export function useCanvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
  deps: readonly unknown[],
): THREE.CanvasTexture {
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return { canvas: c, texture: t };
  }, [width, height]);

  useEffect(() => {
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, width, height);
    draw(ctx, width, height);
    texture.needsUpdate = true;
    // `draw` is rebuilt every render; `deps` says when its output changes.
  }, [canvas, texture, width, height, ...deps]);

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

/** A caret that blinks while `active`: true half the time. */
export function useCaret(active: boolean): boolean {
  const [on, setOn] = useState(true);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setOn((v) => !v), 530);
    return () => window.clearInterval(id);
  }, [active]);
  return active && on;
}

/** A 0→1 pulse fired whenever `signal` changes, fading back to 0: for keystroke reactions. */
export function usePulse(signal: number, fade = 7): React.MutableRefObject<number> {
  const pulse = useRef(0);
  const last = useRef(signal);
  useFrame((_, delta) => {
    if (signal !== last.current) {
      last.current = signal;
      pulse.current = 1;
    }
    pulse.current = THREE.MathUtils.damp(pulse.current, 0, fade, delta);
  });
  return pulse;
}
