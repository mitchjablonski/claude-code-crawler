/**
 * Juice / feedback (V6): PURE-UI presentation helpers that turn the player's
 * LAST action into transient, snapshot-verifiable "beats" — a `-N` on the enemy
 * that was hit, a `DOWN` tag on one slain this action, a `+Nblk` when the
 * player's block rose, a `+Ng`/`+Nhp` when gold/HP rose.
 *
 * Why action-DERIVED (not a fading timer): our verification harness reads static
 * frames + presses keys, so a flash that fades on a wall-clock timer can never
 * be captured. Instead every beat is DERIVED by diffing the prior state against
 * the current state and PERSISTS until the next action changes state again, then
 * recomputes. A snapshot taken right after an action therefore SHOWS the beat.
 *
 * Purity: this module is read-only over engine state and returns plain data. It
 * never mutates state, never touches RNG/the wall clock, and never feeds back
 * into game logic — beats are ephemeral display only.
 */
import { useRef } from 'react';
import type { CombatState, StatusId, Statuses } from '../engine/types.js';

/**
 * Hold the value of `current` as it was BEFORE the most recent change, so a
 * caller can diff "what changed on the last action". Identity-based: each render
 * compares `current` to the value we last recorded; only when it DIFFERS (a new
 * action produced a new state object) do we advance — the previously-current
 * value becomes the new "prior", which then PERSISTS across re-renders until the
 * next change. This is the verifiable core of the juice model: beats derived
 * from this prior stay visible until the next action recomputes them.
 *
 * Returns `null` on the first render (no prior yet → callers show no beat) and
 * whenever `current` is null (e.g. combat ended → no stale combat beats).
 */
export function usePrevOnChange<T>(current: T): T | null {
  const prior = useRef<T | null>(null);
  const lastSeen = useRef<T | null>(null);
  if (current !== lastSeen.current) {
    prior.current = lastSeen.current;
    lastSeen.current = current;
  }
  return prior.current;
}

/** A transient damage/slain beat to render on one enemy row. */
export interface EnemyBeat {
  /** Positive HP lost by this enemy since the prior state (0 → no damage beat). */
  readonly damage: number;
  /** True iff this enemy was alive in the prior state and is dead now. */
  readonly slain: boolean;
}

/**
 * Damage at/above this earns a punchy emphasis marker (`!`) so a heavy hit READS
 * harder than a chip — magnitude emphasis that is purely derived from the size of
 * the damage beat (the prior-vs-current HP delta), never a timer. Kept as a named
 * threshold so the cue is tunable in one place and unit-testable. {@link bigHit}.
 */
export const BIG_HIT_THRESHOLD = 12;

/** True iff a damage beat is a "big hit" (>= {@link BIG_HIT_THRESHOLD}). */
export function bigHit(damage: number): boolean {
  return damage >= BIG_HIT_THRESHOLD;
}

/** A transient status-change beat: one status whose stack count changed. */
export interface StatusBeat {
  /** Which status changed (drives the icon + identity color at the call site). */
  readonly id: StatusId;
  /** Signed stack delta since the prior state (never 0; + gained, - lost). */
  readonly delta: number;
}

/**
 * Diff a prior status map against the current one to derive per-status change
 * beats on the LAST action — mirroring {@link enemyBeats} for the status axis.
 * Returns one beat per status whose stack count rose OR fell (the signed delta),
 * so a card that applies Vulnerable shows `+2VUL`, a power that grants Strength
 * shows `+1STR`, poison added shows `+Npsn`, and an end-of-turn decay/tick reads
 * as `-1`. Ordering is stable (current keys first, then statuses only the prior
 * had — i.e. ones that dropped to zero/cleared) so renders are deterministic.
 *
 * Returns an empty array when there is no prior (first render) or nothing
 * changed, so callers show no beat. Pure: reads the two maps only, no clock/RNG.
 */
export function statusBeats(
  prior: Statuses | null,
  current: Statuses,
): readonly StatusBeat[] {
  if (!prior) return [];
  const seen = new Set<StatusId>();
  const order: StatusId[] = [
    ...(Object.keys(current) as StatusId[]),
    ...(Object.keys(prior) as StatusId[]),
  ];
  const beats: StatusBeat[] = [];
  for (const id of order) {
    if (seen.has(id)) continue;
    seen.add(id);
    const delta = (current[id] ?? 0) - (prior[id] ?? 0);
    if (delta !== 0) beats.push({ id, delta });
  }
  return beats;
}

/**
 * Diff the prior combat against the current one to derive a per-enemy beat,
 * indexed the same as `current.enemies` (stable indices — the reducer never
 * reorders or removes enemies, it zeroes their HP). Returns an empty array on
 * the first render (no prior) or when the enemy roster shape changed (combat
 * swapped out), so we never show a stale beat from a different fight.
 */
export function enemyBeats(
  prior: CombatState | null,
  current: CombatState,
): readonly EnemyBeat[] {
  if (!prior || prior.enemies.length !== current.enemies.length) return [];
  return current.enemies.map((now, i) => {
    const was = prior.enemies[i];
    if (!was) return { damage: 0, slain: false };
    const damage = Math.max(0, was.hp - now.hp);
    const slain = was.hp > 0 && now.hp <= 0;
    return { damage, slain };
  });
}
