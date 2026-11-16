"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * The profile as NASA's Moon: its lit share is the profile's completeness, a
 * thin crescent when empty and full at 100%. Drag spins it. Clicking it opens
 * the wizard, and the best vacancies orbit it as NASA spacecraft, closer the
 * better they match; clicking one opens that vacancy.
 */

export interface Satellite {
  id: string;
  title: string;
  score: number;
}

// Real models: the Moon from NASA Goddard's LRO data, spacecraft from NASA 3D Resources.
const MOON_URL = "/models/moon.glb";
const SPACECRAFT = ["iss", "kepler", "mro", "seastar", "grace"].map((n) => `/models/${n}.glb`);

/** Where the sun sits for a given completeness: behind at 0, beside the camera at 1. */
function sunPosition(phase: number, out: THREE.Vector3): THREE.Vector3 {
  const angle = (1 - phase) * THREE.MathUtils.degToRad(150);
  return out.set(Math.sin(angle) * 10, 2.2, Math.cos(angle) * 10);
}

/** A copy of a loaded model, centred on the origin and scaled to `size` across. */
function fitted(source: THREE.Object3D, size: number): THREE.Object3D {
  const copy = source.clone(true);
  const box = new THREE.Box3().setFromObject(copy);
  const span = box.getSize(new THREE.Vector3());
  copy.position.sub(box.getCenter(new THREE.Vector3()));
  const wrapper = new THREE.Group();
  wrapper.add(copy);
  wrapper.scale.setScalar(size / Math.max(span.x, span.y, span.z));
  return wrapper;
}

/** Drag to spin, with a little inertia; idle, it turns slowly by itself. */
function useSpin(still: boolean) {
  const { gl } = useThree();
  const spin = useRef({ x: 0.2, y: 0, vx: 0, vy: 0, dragging: false, lastX: 0, lastY: 0 });

  useEffect(() => {
    const el = gl.domElement;
    const s = spin.current;
    const down = (e: PointerEvent): void => {
      s.dragging = true;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
    };
    const move = (e: PointerEvent): void => {
      if (!s.dragging) return;
      s.vy = (e.clientX - s.lastX) * 0.008;
      s.vx = (e.clientY - s.lastY) * 0.008;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
    };
    const up = (): void => {
      s.dragging = false;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const s = spin.current;
    s.y += s.vy + (s.dragging || still ? 0 : delta * 0.08);
    s.x = THREE.MathUtils.clamp(s.x + s.vx, -0.8, 0.8);
    s.vx *= 0.9;
    s.vy *= 0.9;
  });

  return spin;
}

/** A click that ended a drag is not a click. */
const isClick = (e: ThreeEvent<MouseEvent>): boolean => e.delta < 5;

function Moon({
  target,
  still,
  onOpen,
  onHover,
}: {
  target: number;
  still: boolean;
  onOpen?: (() => void) | undefined;
  onHover: (label: string | null) => void;
}) {
  const gltf = useLoader(GLTFLoader, MOON_URL);
  const moon = useMemo(() => {
    const model = fitted(gltf.scene, 2);
    // The source material is a glossy Blender export; the Moon is dust, not plastic.
    model.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshStandardMaterial) {
        o.material.roughness = 1;
        o.material.metalness = 0;
        if (o.material instanceof THREE.MeshPhysicalMaterial) {
          o.material.clearcoat = 0;
          o.material.specularIntensity = 0;
        }
      }
    });
    return model;
  }, [gltf]);

  const group = useRef<THREE.Group>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const phase = useRef(still ? target : 0);
  const spin = useSpin(still);
  const glowUniforms = useMemo(() => ({ uColor: { value: new THREE.Color("#9748ff") } }), []);

  useFrame((_, delta) => {
    // Fill from a crescent up to the real completeness, then follow it live.
    phase.current = still ? target : THREE.MathUtils.damp(phase.current, target, 1.6, delta);
    if (sun.current) sunPosition(phase.current, sun.current.position);
    if (group.current) group.current.rotation.set(spin.current.x, spin.current.y, 0);
  });

  return (
    <>
      <ambientLight color="#7c00ff" intensity={0.35} />
      <directionalLight ref={sun} intensity={3.4} color="#fff8ee" />
      <group ref={group}>
        <primitive
          object={moon}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            if (onOpen && isClick(e)) onOpen();
          }}
          onPointerOver={() => onOpen && onHover("Tu perfil · clic para completarlo")}
          onPointerOut={() => onHover(null)}
        />
      </group>
      <mesh scale={1.35}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          vertexShader={GLOW_VERTEX}
          fragmentShader={GLOW_FRAGMENT}
          uniforms={glowUniforms}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

function Orbit({
  satellite,
  index,
  still,
  onOpen,
  onHover,
}: {
  satellite: Satellite;
  index: number;
  still: boolean;
  onOpen: (id: string) => void;
  onHover: (label: string | null) => void;
}) {
  const gltf = useLoader(GLTFLoader, SPACECRAFT[index % SPACECRAFT.length] as string);
  const craft = useMemo(() => fitted(gltf.scene, 0.32), [gltf]);
  const arm = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

