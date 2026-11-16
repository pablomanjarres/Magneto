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

  // A better match flies a tighter orbit; each one starts at its own angle and tilt.
  const radius = 1.5 + (1 - satellite.score / 100) * 1.1;
  const speed = 0.25 / radius;
  const angle = useRef((index / 5) * Math.PI * 2);
  const tilt = (index % 2 === 0 ? 1 : -1) * (0.18 + index * 0.06);

  useFrame((_, delta) => {
    // A hovered satellite holds still so it can be clicked.
    if (!still && !hovered) angle.current += delta * speed;
    if (arm.current) arm.current.rotation.y = angle.current;
    if (body.current) {
      body.current.rotation.y += still || hovered ? 0 : delta * 0.6;
      const scale = THREE.MathUtils.damp(body.current.scale.x, hovered ? 1.6 : 1, 8, delta);
      body.current.scale.setScalar(scale);
    }
  });

  return (
    <group rotation={[tilt, 0, tilt * 0.5]}>
      <group ref={arm}>
        <group
          ref={body}
          position={[radius, 0, 0]}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation();
            if (isClick(e)) onOpen(satellite.id);
          }}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            setHovered(true);
            onHover(`${satellite.title} · ${satellite.score}% match`);
          }}
          onPointerOut={() => {
            setHovered(false);
            onHover(null);
          }}
        >
          <primitive object={craft} />
          {/* The spacecraft are tiny; this invisible sphere is what the pointer hits. */}
          <mesh>
            <sphereGeometry args={[0.3, 12, 12]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Stars({ still }: { still: boolean }) {
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    let seed = 42;
    const rand = (): number => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const positions = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i++) {
      const r = 7 + rand() * 7;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(rand() * 2 - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = -Math.abs(r * Math.cos(phi));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  useFrame((_, delta) => {
    if (!still && points.current) points.current.rotation.z += delta * 0.01;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial size={0.045} color="#e4d6ff" transparent opacity={0.85} sizeAttenuation />
    </points>
  );
}

const GLOW_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const GLOW_FRAGMENT = `
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    // Seen from inside the back faces: strongest at the moon's limb, gone at the edge.
    float halo = pow(abs(dot(vNormal, vView)), 3.5);
    gl_FragColor = vec4(uColor, halo * 1.3);
  }
`;

/** Honours "reduce motion": nothing turns on its own, the phase is drawn final. */
function usePrefersStill(): boolean {
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

export default function MoonScene({
  percentage,
  satellites = [],
  moonHref,
}: {
  percentage: number;
  satellites?: Satellite[] | undefined;
  moonHref?: string | undefined;
}) {
  const router = useRouter();
  const still = usePrefersStill();
  const [label, setLabel] = useState<string | null>(null);
  const target = Math.max(0, Math.min(100, percentage)) / 100;

  return (
    <div
      className={`relative h-full ${label ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"}`}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 5], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        aria-hidden="true"
      >
        <Stars still={still} />
        <Suspense fallback={null}>
          <Moon
            target={target}
            still={still}
            onOpen={moonHref ? () => router.push(moonHref) : undefined}
            onHover={setLabel}
          />
          {satellites.slice(0, SPACECRAFT.length).map((s, i) => (
            <Orbit
              key={s.id}
              satellite={s}
              index={i}
              still={still}
              onOpen={(id) => router.push(`/jobs/${id}`)}
              onHover={setLabel}
            />
          ))}
        </Suspense>
      </Canvas>
      {label && (
        <p className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 animate-pop rounded-full bg-white px-4 py-1.5 text-sm font-bold whitespace-nowrap text-navy shadow-lg">
          {label}
        </p>
      )}
    </div>
  );
}
