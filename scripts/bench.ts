/**
 * Comparison PoC, branch A vs branch B.
 *
 * Both backends run the same scoring engine from @moonlight/core against the same
 * database, so whatever difference shows up here is transport and runtime, not logic.
 *
 *   pnpm --filter @moonlight/api start   # :4000  Express
 *   pnpm --filter @moonlight/web dev     # :3000  Next route handlers
 *   pnpm bench
 */
const TARGETS = [
  { name: "Next route handlers", base: "http://localhost:3000/api" },
  { name: "Express service", base: "http://localhost:4000" },
];

const ROUTES = ["/vacancies", "/profiles/demo-candidate/recommendations"];
const WARMUP = 20;
const RUNS = 200;

const quantile = (sorted: number[], q: number): number =>
  sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] ?? 0;

async function measure(url: string): Promise<{ p50: number; p95: number; mean: number }> {
  for (let i = 0; i < WARMUP; i += 1) await fetch(url);

  const times: number[] = [];
  for (let i = 0; i < RUNS; i += 1) {
    const start = performance.now();
    const res = await fetch(url);
    await res.arrayBuffer();
    times.push(performance.now() - start);
  }

  times.sort((a, b) => a - b);
  return {
    p50: quantile(times, 0.5),
    p95: quantile(times, 0.95),
    mean: times.reduce((a, b) => a + b, 0) / times.length,
  };
}

const ms = (n: number): string => `${n.toFixed(1)} ms`;

async function main(): Promise<void> {
  for (const target of TARGETS) {
    const reachable = await fetch(`${target.base}/health`).then(
      (r) => r.ok,
      () => false,
    );
    if (!reachable) {
      console.log(`${target.name}: not running at ${target.base}, skipped`);
      continue;
    }

    console.log(`\n${target.name}  (${RUNS} requests each, ${WARMUP} warmup)`);
    for (const route of ROUTES) {
      const r = await measure(`${target.base}${route}`);
      console.log(`  ${route.padEnd(42)} p50 ${ms(r.p50)}   p95 ${ms(r.p95)}   mean ${ms(r.mean)}`);
    }
  }
}

void main();
