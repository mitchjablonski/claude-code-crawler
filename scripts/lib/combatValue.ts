/**
 * State-aware combat-value heuristic for the dev playtest harness (NOT shipped).
 *
 * Increment #57: the greedy harness combat policy was poison-BLIND. It iterated
 * card TYPES in a fixed order and played the first affordable card of each type,
 * never valuing poison, never timing a poison-payoff card, always targeting the
 * lowest-HP enemy. So apothecary's poison ramp (Venom Reprisal, Detonation Vial,
 * Tipped Blade, ...) was played randomly, which produced PHANTOM balance signals:
 * apothecary nightmare cells looked ~8-12pp behind knight under greedy while MCTS
 * (the arbiter) wins those cells ~1.0 (= knight). The gap was a greedy-policy
 * artifact, not a content gap.
 *
 * This module gives greedy a cheap, pure, deterministic, ONE-PLY estimate of how
 * good it is to PLAY a card right now against a chosen target. It is NOT a
 * lookahead / tree search — it values a single play against the CURRENT combat
 * state. The combat policy (playtest.ts) uses it to pick the best affordable play
 * each step, then repeat until no positive-value play remains.
 *
 * Key state-aware ideas (vs the static draft scorer in scoreCard.ts):
 *  - POISON is valued by its CUMULATIVE worth. Poison ticks its current value
 *    each round end, then decays by 1, so applying `s` stacks on an enemy that
 *    already has `p` deals (over the poison's life) f(p+s) - f(p) where
 *    f(q)=q(q+1)/2 — i.e. each stack is worth more when more poison is already
 *    down. Capped at the enemy's HP (poison can't kill more than it has). This is
 *    why a competent player stacks poison early and on the same target.
 *  - CONDITIONAL poison-payoff cards (`conditional` w/ `targetHasStatus`) are
 *    valued through the REAL predicate against the chosen target: the `then`
 *    branch counts only when the target ACTUALLY meets the threshold (so the bot
 *    "detonates" Detonation Vial at >=5 poison, Venom Reprisal at >=1), else only
 *    the cold base counts.
 *  - DAMAGE uses the engine's own attackDamage (strength/weak/vulnerable) and is
 *    capped at target HP so overkill isn't over-valued.
 *
 * Pure & deterministic: reads only the combat state + the closed Effect set, no
 * rng, no clock, no mutation. Tooling-only.
 */
import { attackDamage, getStatus } from '../../src/engine/effects.js';
import type {
  CardDef,
  CombatState,
  Effect,
  EffectCondition,
  Statuses,
  TargetKind,
} from '../../src/engine/types.js';

/** Each point of immediate (or poison) damage is worth this. */
const DAMAGE_VALUE = 1.0;
/** Block is defensive: discounted under an offensive (greedy/attack) lean. */
const BLOCK_WEIGHT_ATTACK = 0.5;
/** Under a defensive (cautious/block) lean, block is worth more than offense. */
const BLOCK_WEIGHT_BLOCK = 1.15;
/** Drawing a card replaces itself + digs — modest tempo value. */
const DRAW_VALUE = 1.6;
/** +1 energy refunds a play; ~a strong card's worth of future tempo. */
const ENERGY_VALUE = 3.5;
/** In-combat heal is weak vs block; capped at missing HP. */
const HEAL_VALUE = 0.4;
/** Poison damage is delayed (slightly discounted vs immediate) but bypasses block. */
const POISON_WEIGHT = 0.95;

/**
 * Per-stack value of the non-poison statuses (poison has its own cumulative
 * model). Scaling buffs (strength/dexterity) are worth more than timed debuffs.
 */
const STATUS_VALUE: Record<string, number> = {
  strength: 4.0,
  dexterity: 2.0,
  regen: 2.0,
  vulnerable: 2.0,
  weak: 1.5,
};

/** Cumulative poison damage over its decaying life: f(q) = q(q+1)/2. */
function poisonLifetime(stacks: number): number {
  return (stacks * (stacks + 1)) / 2;
}

/** Indices of living enemies an effect of `target` would hit (self -> []). */
function targetIndices(
  combat: CombatState,
  target: TargetKind,
  targetIndex: number | undefined,
): number[] {
  if (target === 'self') return [];
  if (target === 'allEnemies') {
    const out: number[] = [];
    combat.enemies.forEach((e, i) => {
      if (e.hp > 0) out.push(i);
    });
    return out;
  }
  // single 'enemy'
  if (targetIndex === undefined) return [];
  const e = combat.enemies[targetIndex];
  return e && e.hp > 0 ? [targetIndex] : [];
}

/**
 * Evaluate a conditional predicate against the current state + selected target.
 * Mirrors the engine's evalCondition (effects.ts) — kept pure/local so the helper
 * does not depend on an engine internal. Reads only state, draws no rng.
 */
function conditionHolds(
  combat: CombatState,
  condition: EffectCondition,
  targetIndex: number | undefined,
): boolean {
  switch (condition.type) {
    case 'targetHasStatus': {
      const need = condition.atLeast ?? 1;
      const enemy =
        targetIndex !== undefined
          ? combat.enemies[targetIndex]
          : combat.enemies.find((e) => e.hp > 0);
      if (!enemy) return false;
      return getStatus(enemy.statuses, condition.status) >= need;
    }
    case 'enemyCount': {
      const living = combat.enemies.filter((e) => e.hp > 0).length;
      if (condition.op === 'eq') return living === condition.value;
      if (condition.op === 'lte') return living <= condition.value;
      return living >= condition.value;
    }
  }
}

function effectValue(
  combat: CombatState,
  effect: Effect,
  targetIndex: number | undefined,
  blockWeight: number,
): number {
  switch (effect.kind) {
    case 'damage': {
      const times = effect.times ?? 1;
      let total = 0;
      for (const i of targetIndices(combat, effect.target, targetIndex)) {
        const e = combat.enemies[i];
        if (!e) continue;
        const perHit = attackDamage(effect.amount, combat.playerStatuses, e.statuses);
        total += Math.min(perHit * times, e.hp) * DAMAGE_VALUE;
      }
      return total;
    }
    case 'block': {
      const amt = Math.max(0, effect.amount + getStatus(combat.playerStatuses, 'dexterity'));
      return amt * blockWeight;
    }
    case 'draw':
      return effect.count * DRAW_VALUE;
    case 'gainEnergy':
      return effect.amount * ENERGY_VALUE;
    case 'heal': {
      const missing = Math.max(0, combat.playerMaxHp - combat.playerHp);
      return Math.min(effect.amount, missing) * HEAL_VALUE;
    }
    case 'applyStatus': {
      if (effect.status === 'poison') {
        let total = 0;
        for (const i of targetIndices(combat, effect.target, targetIndex)) {
          const e = combat.enemies[i];
          if (!e) continue;
          const have = getStatus(e.statuses, 'poison');
          const marginal = poisonLifetime(have + effect.stacks) - poisonLifetime(have);
          // Poison can't remove more HP than the enemy has.
          total += Math.min(marginal, e.hp) * POISON_WEIGHT;
        }
        return total;
      }
      const per = STATUS_VALUE[effect.status] ?? 1.0;
      if (effect.target === 'self') return effect.stacks * per;
      const targets = targetIndices(combat, effect.target, targetIndex);
      return targets.length * effect.stacks * per;
    }
    case 'conditional': {
      const branch = conditionHolds(combat, effect.condition, targetIndex)
        ? effect.then
        : (effect.else ?? []);
      let total = 0;
      for (const inner of branch) total += effectValue(combat, inner, targetIndex, blockWeight);
      return total;
    }
  }
}

export interface CombatValueOpts {
  /** 'attack' (greedy) discounts block; 'block' (cautious) values it up. */
  readonly prefer?: 'attack' | 'block';
}

/**
 * The one-ply value of playing `card` against `targetIndex` in `combat`. Higher
 * is better; pure & deterministic. For single-target cards `targetIndex` selects
 * the enemy; for self/allEnemies cards it is ignored (pass undefined).
 */
export function combatValue(
  card: CardDef,
  combat: CombatState,
  targetIndex: number | undefined,
  opts: CombatValueOpts = {},
): number {
  const blockWeight = opts.prefer === 'block' ? BLOCK_WEIGHT_BLOCK : BLOCK_WEIGHT_ATTACK;
  let total = 0;
  for (const e of card.effects) total += effectValue(combat, e, targetIndex, blockWeight);
  return total;
}

/** Exposed for callers that need to know the cumulative poison model (tests). */
export function poisonLifetimeValue(have: number, add: number): number {
  return poisonLifetime(have + add) - poisonLifetime(have);
}

/** Re-export to let the policy read poison without importing the engine twice. */
export function enemyPoison(statuses: Statuses): number {
  return getStatus(statuses, 'poison');
}
