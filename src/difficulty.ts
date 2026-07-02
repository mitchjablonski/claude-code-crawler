/**
 * Difficulty / run-mode knobs — split out of `config.ts` (Web A1) so the BROWSER
 * client can import them: `config.ts` reads ambient Node builtins (`node:os`,
 * `node:path`) and must stay server-side, while these tables are pure data the
 * web Title screen needs to build a RunConfig exactly like the terminal does.
 * `config.ts` re-exports everything here, so all existing imports are unchanged.
 *
 * PURITY: this module must stay dependency-free (no Node builtins, no engine
 * runtime) — it is shared verbatim by the terminal and web renderers.
 */

export type Difficulty = 'story' | 'normal' | 'hard' | 'nightmare';

export const DIFFICULTIES: readonly Difficulty[] = ['story', 'normal', 'hard', 'nightmare'];
export const DEFAULT_DIFFICULTY: Difficulty = 'normal';

export type RunMode = 'single' | 'arc';

export const RUN_MODES: readonly RunMode[] = ['single', 'arc'];
export const DEFAULT_RUN_MODE: RunMode = 'single';
// #82: arc gained a fourth, deeper act ("Corrupted Core"). Single mode is still
// one act (act 0), so this ONLY lengthens arc; act 0 stays byte-identical.
export const ARC_ACTS = 4;

/** Acts in a run for a given mode (single session vs multi-act arc). */
export function actsForMode(mode: RunMode): number {
  return mode === 'arc' ? ARC_ACTS : 1;
}

export interface DifficultyKnobs {
  readonly maxHp: number;
  readonly enemyHpMult: number;
  readonly startingGold: number;
  /**
   * Arc-only per-act enemy-HP ramp indexed by act (index 0 is always 1.0 so
   * single mode stays byte-identical). Undefined for single mode → no ramp.
   */
  readonly actHpRamp?: readonly number[];
  /**
   * Multiplier applied to event `loseHp` outcome amounts so risk branches bite
   * at higher difficulty (#34). MUST be exactly 1.0 on normal/story so seeded
   * normal replay stays byte-identical (the scalar only touches the resolved
   * amount, never the rng stream). Same per (difficulty) in both modes.
   */
  readonly eventLoseHpMult: number;
}

/**
 * Event `loseHp` scalar per difficulty (#34). normal/story are exactly 1.0 so
 * normal seeded replay is byte-identical; hard/nightmare add teeth to the
 * "risky" event branches that were toothless at hard+ in playtest.
 */
const EVENT_LOSE_HP_MULT: Readonly<Record<Difficulty, number>> = {
  story: 1.0,
  normal: 1.0,
  hard: 1.25,
  nightmare: 1.5,
};

/** Single-mode per-tier knobs (greedy: story ~84 / normal ~67 / hard ~41 / nightmare ~23). */
export const DIFFICULTY_KNOBS: Readonly<Record<Difficulty, DifficultyKnobs>> = {
  story: { maxHp: 70, enemyHpMult: 0.85, startingGold: 50, eventLoseHpMult: EVENT_LOSE_HP_MULT.story },
  normal: { maxHp: 70, enemyHpMult: 1.0, startingGold: 50, eventLoseHpMult: EVENT_LOSE_HP_MULT.normal },
  hard: { maxHp: 70, enemyHpMult: 1.18, startingGold: 50, eventLoseHpMult: EVENT_LOSE_HP_MULT.hard },
  nightmare: { maxHp: 70, enemyHpMult: 1.33, startingGold: 50, eventLoseHpMult: EVENT_LOSE_HP_MULT.nightmare },
};

/**
 * Arc base enemy-HP multiplier (act 0). Arc adds two more acts of rewards, and
 * the old flat bump left later acts too soft (players ended arcs far healthier
 * than single). Act 0 now sits close to single, and the per-act ramp below does
 * the difficulty work so the LATER acts — where arc players were over-healthy —
 * are the parts that bite. Swept to match single's greedy win-rate bands per
 * tier for both characters (see ARC_ACT_HP_RAMP).
 */
const ARC_ENEMY_HP_MULT: Readonly<Record<Difficulty, number>> = {
  story: 0.74,
  normal: 0.96,
  hard: 1.15,
  nightmare: 1.43,
};

/**
 * Arc per-act enemy-HP ramp, multiplied onto ARC_ENEMY_HP_MULT for combats in
 * that act. Index 0 is ALWAYS 1.0 (act 0 == base mult) so single mode (act 0
 * only) is byte-identical; acts 1 and 2 escalate so deeper acts are meaningfully
 * harder and arc players stop ending vastly healthier than single players.
 */
// #82: extended with a fourth entry (act 3, "Corrupted Core"). The deepest act
// already ships TANKIER tier-4 enemies + a heavier boss, so its ramp scalar is
// only a MODEST step above act 2 — the base HP of the new content does most of
// the escalation, and the extra act's attrition is itself a difficulty lever.
const ARC_ACT_HP_RAMP: Readonly<Record<Difficulty, readonly number[]>> = {
  story: [1.0, 1.1, 1.22, 1.27],
  // normal/hard/nightmare intentionally share one ramp shape — the per-tier
  // difficulty is carried by ARC_ENEMY_HP_MULT (the base), not the ramp. Story
  // ramps gentler so its already-low base doesn't over-soften late acts.
  normal: [1.0, 1.13, 1.27, 1.3],
  hard: [1.0, 1.13, 1.27, 1.3],
  nightmare: [1.0, 1.13, 1.27, 1.3],
};

/** Difficulty knobs for a (difficulty, mode) pair so a tier means the same challenge in both modes. */
export function knobsFor(difficulty: Difficulty, mode: RunMode): DifficultyKnobs {
  const base = DIFFICULTY_KNOBS[difficulty];
  return mode === 'arc'
    ? { ...base, enemyHpMult: ARC_ENEMY_HP_MULT[difficulty], actHpRamp: ARC_ACT_HP_RAMP[difficulty] }
    : base;
}
