/**
 * New-run seeding. Mirrors the terminal (`useGame.newRun`): an explicit seed
 * wins (there `deps.seed` from `--seed`/CCC_SEED; here the `?seed=` URL param),
 * otherwise a fresh `run-<time36>-<rand6>` seed is derived at the EXPLICIT
 * new-run boundary. The web derivation uses `crypto.getRandomValues` — never
 * `Math.random` — and the clock is only read here, at the boundary; everything
 * after `createRun(seed)` is fully deterministic in the seed.
 */

/** The `?seed=` URL param, or null when absent/blank. */
export function seedFromLocation(search: string): string | null {
  const seed = new URLSearchParams(search).get('seed');
  return seed !== null && seed.trim() !== '' ? seed : null;
}

/** Derive a fresh run seed (presentation-boundary randomness only). */
export function freshSeed(now: () => number = Date.now): string {
  const buf = new Uint32Array(2);
  crypto.getRandomValues(buf);
  const rand = ((buf[0] ?? 0).toString(36) + (buf[1] ?? 0).toString(36) + '000000').slice(0, 6);
  return `run-${now().toString(36)}-${rand}`;
}
