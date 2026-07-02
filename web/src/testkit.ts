/**
 * Test-only helpers: drive the REAL engine (createRun/applyAction, no mocks)
 * to a wanted phase so screen tests can mount the shell mid-run via App's
 * `initialState` seam. The policy is deterministic (no Math.random/Date.now):
 * seeds are searched in a fixed order and every step is a legal GameAction.
 */
import { applyAction, createRun } from '@game/engine/run.js';
import { content } from '@game/engine/content/index.js';
import { eventRequirementMet } from '@game/engine/types.js';
import type { GameAction, MapNode, NodeKind, Phase, RunState } from '@game/engine/types.js';
import { runConfigFor } from './game.js';
import type { RunConfig } from '@game/engine/run.js';

export function newRun(seed: string, extra?: Partial<RunConfig>, character = 'knight'): RunState {
  const config = { ...runConfigFor(character, 'normal', 'single'), ...(extra ?? {}) };
  return createRun(content, seed, config);
}

export function mapChoices(state: RunState): MapNode[] {
  const node = state.map.nodes[state.currentNodeId];
  return (node?.next ?? [])
    .map((id) => state.map.nodes[id])
    .filter((n): n is MapNode => n !== undefined);
}

/**
 * One deterministic policy step. On the map it prefers a node of `prefer` when
 * adjacent (else the first choice); in combat it plays the first affordable
 * card (targeting the first living enemy when required) or ends the turn;
 * everywhere else it takes the cheapest exit (skip/leave/rest/first option).
 */
export function policyAction(state: RunState, prefer?: NodeKind): GameAction | null {
  switch (state.phase) {
    case 'map': {
      const choices = mapChoices(state);
      const pick = choices.find((c) => c.kind === prefer) ?? choices[0];
      return pick ? { type: 'chooseNode', nodeId: pick.id } : null;
    }
    case 'combat': {
      const combat = state.combat!;
      const living = combat.enemies.findIndex((e) => e.hp > 0);
      for (let i = 0; i < combat.hand.length; i++) {
        const card = content.cards[combat.hand[i]!];
        if (!card || card.cost > combat.energy) continue;
        if (card.target === 'enemy') {
          if (living < 0) continue;
          return { type: 'playCard', handIndex: i, targetIndex: living };
        }
        return { type: 'playCard', handIndex: i };
      }
      return { type: 'endTurn' };
    }
    case 'reward':
      return { type: 'skipReward' };
    case 'shop':
      return { type: 'leaveShop' };
    case 'rest':
      return { type: 'rest' };
    case 'event': {
      if (state.event?.result) return { type: 'continueEvent' };
      const def = state.event ? content.events[state.event.eventId] : undefined;
      const index = (def?.options ?? []).findIndex((o) => eventRequirementMet(state, o.requires));
      return index >= 0 ? { type: 'chooseEventOption', index } : null;
    }
    default:
      return null; // victory/defeat — terminal
  }
}

/**
 * Apply the policy until `done(state)` (or a terminal phase / the step cap).
 * Returns the first state satisfying the predicate, or null.
 */
export function driveUntil(
  start: RunState,
  done: (s: RunState) => boolean,
  prefer?: NodeKind,
  maxSteps = 400,
): RunState | null {
  let state = start;
  for (let i = 0; i < maxSteps; i++) {
    if (done(state)) return state;
    const action = policyAction(state, prefer);
    if (!action) return null;
    state = applyAction(content, state, action);
  }
  return done(state) ? state : null;
}

/**
 * Search seeds (`<base>-0..N`) for a run the policy can drive to a state
 * satisfying `done`. Deterministic: fixed seed order, fixed policy. Throws if
 * none matches so a failing content change surfaces loudly in tests.
 */
export function findState(
  base: string,
  done: (s: RunState) => boolean,
  opts?: {
    readonly prefer?: NodeKind;
    readonly seeds?: number;
    readonly extra?: Partial<RunConfig>;
    readonly character?: string;
  },
): { state: RunState; seed: string } {
  const seeds = opts?.seeds ?? 40;
  for (let i = 0; i < seeds; i++) {
    const seed = `${base}-${i}`;
    const found = driveUntil(newRun(seed, opts?.extra, opts?.character), done, opts?.prefer);
    if (found) return { state: found, seed };
  }
  throw new Error(`no seed under ${base}-* reached the wanted state`);
}

/** Shorthand: the first state in `phase` (with an optional extra check). */
export function findPhase(
  base: string,
  phase: Phase,
  check: (s: RunState) => boolean = () => true,
  opts?: {
    readonly prefer?: NodeKind;
    readonly seeds?: number;
    readonly extra?: Partial<RunConfig>;
    readonly character?: string;
  },
): { state: RunState; seed: string } {
  const preferKind: NodeKind | undefined =
    opts?.prefer ??
    (phase === 'shop' ? 'shop' : phase === 'rest' ? 'rest' : phase === 'event' ? 'event' : phase === 'combat' ? 'combat' : undefined);
  return findState(base, (s) => s.phase === phase && check(s), {
    ...(preferKind ? { prefer: preferKind } : {}),
    ...(opts?.seeds !== undefined ? { seeds: opts.seeds } : {}),
    ...(opts?.extra !== undefined ? { extra: opts.extra } : {}),
    ...(opts?.character !== undefined ? { character: opts.character } : {}),
  });
}
