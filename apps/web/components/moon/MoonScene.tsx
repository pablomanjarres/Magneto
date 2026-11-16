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
