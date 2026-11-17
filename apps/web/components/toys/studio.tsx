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

/** A rectangle with round corners, centred on the origin. */
export function roundedRect(w: number, h: number, r: number): THREE.Shape {
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

/**
 * A flat slab lying on the floor plane, centred on the origin: `width` by
 * `depth` with round corners of `corner`, `height` thick, every edge rounded
 * off by `bevel`. Big corners with small bevels read as moulded plastic.
 */
export function slab(
  width: number,
  height: number,
  depth: number,
  corner: number,
  bevel: number,
): THREE.BufferGeometry {
  const straight = height - 2 * bevel;
  const geometry = new THREE.ExtrudeGeometry(
    roundedRect(width - 2 * bevel, depth - 2 * bevel, corner - bevel),
    {
      depth: straight,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 8,
      curveSegments: 24,
    },
  );
  // The extrusion runs along z; stand it up so it runs along y, centred.
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -straight / 2, 0);
  return geometry;
}

/** A flat rounded rectangle facing +z whose texture spans it exactly, corner to corner. */
export function panel(w: number, h: number, r: number): THREE.ShapeGeometry {
  const geometry = new THREE.ShapeGeometry(roundedRect(w, h, r), 16);
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / w + 0.5, uv.getY(i) / h + 0.5);
  return geometry;
}

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

/** Soft light from above that casts soft shadows, a little lilac from behind, and reflections for the gloss. */
function Studio() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;
    scene.environmentIntensity = 0.5;
    return () => {
      scene.environment = null;
      environment.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  return (
    <>
      <hemisphereLight args={["#fff7ff", "#ffd9ea", 0.3]} />
      <directionalLight
        position={[2.5, 4.5, 6]}
        intensity={1.35}
        color="#fffaf2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-2.6}
        shadow-camera-right={2.6}
        shadow-camera-top={2.6}
        shadow-camera-bottom={-2.6}
        shadow-camera-near={3}
        shadow-camera-far={13}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={8}
      />
      <directionalLight position={[-4, 2.5, -3]} intensity={0.7} color="#c9b2ff" />
    </>
  );
}

/** The floor: an invisible plane that only shows the shadow cast on it. */
function ShadowCatcher({ y }: { y: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
      <planeGeometry args={[12, 12]} />
      <shadowMaterial transparent opacity={0.16} />
    </mesh>
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
 * around the origin; about 3 units wide and 2.6 tall fits the frame. Meshes
 * that should cast or catch shadows say so with `castShadow` and `receiveShadow`.
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
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.NeutralToneMapping,
        toneMappingExposure: 0.9,
      }}
      // Filtered shadow maps, softened by each light's shadow radius. `true` would ask for
      // PCFSoftShadowMap, which three.js no longer has.
      shadows="percentage"
      aria-hidden="true"
    >
      <Studio />
      <SoftShadow y={shadowY} />
      <ShadowCatcher y={shadowY + 0.002} />
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

/** False until the page's web fonts have loaded: text drawn once should be drawn again then. */
export function useFontsReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    void document.fonts.ready.then(() => {
      if (live) setReady(true);
    });
    return () => {
      live = false;
    };
  }, []);
  return ready;
}

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
