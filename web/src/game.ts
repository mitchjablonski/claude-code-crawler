/**
 * Run-config assembly for the web shell. PRESENTATION + DISPATCH ONLY: this is
 * the exact mapping the terminal `App.tsx` does in its `runConfig` memo
 * (class -> starter deck/relics/maxHp, difficulty+mode -> knobs), built from the
 * SAME shared modules. No gameplay logic lives web-side — the engine reducer
 * (`createRun`/`applyAction`) decides everything.
 *
 * B note: with shared saves, `allowedUnlockIds` now threads through exactly as
 * the terminal App does it — only when at least one unlock has been EARNED
 * (derived from the shared run history), so a fresh profile's pool stays
 * byte-identical to pre-E2 in both clients.
 */
import { applyAction, type RunConfig } from '@game/engine/run.js';
import { CHARACTERS, DEFAULT_CHARACTER, content } from '@game/engine/content/index.js';
import { EngineError, type GameAction, type RunState } from '@game/engine/types.js';
import { knobsFor, actsForMode, type Difficulty, type RunMode } from '@game/difficulty.js';

export function runConfigFor(
  characterId: string,
  difficulty: Difficulty,
  runMode: RunMode,
  allowedUnlockIds: readonly string[] = [],
): RunConfig {
  const cls = CHARACTERS[characterId] ?? CHARACTERS[DEFAULT_CHARACTER]!;
  const k = knobsFor(difficulty, runMode);
  return {
    starterDeck: cls.starterDeck,
    startingRelics: cls.startingRelics,
    maxHp: cls.maxHp,
    startingGold: k.startingGold,
    enemyHpMult: k.enemyHpMult,
    ...(k.actHpRamp ? { actHpRamp: k.actHpRamp } : {}),
    eventLoseHpMult: k.eventLoseHpMult,
    acts: actsForMode(runMode),
    // Same rule as the terminal App's runConfig memo: only EARNED unlockables
    // enter the pool; empty => the key is omitted entirely (core-only pool).
    ...(allowedUnlockIds.length > 0 ? { allowedUnlockIds } : {}),
  };
}

/**
 * THE web dispatch reducer — the exact step App.tsx applies for every player
 * action, mirroring the terminal's `useGame.dispatch`: one `applyAction`
 * through the shared engine, where invalid input for the current state
 * (EngineError) is a NO-OP rather than a crash. Exported so the REQ-3
 * cross-client parity test drives the same function the shell dispatches.
 */
export function stepRun(state: RunState, action: GameAction): RunState {
  try {
    return applyAction(content, state, action);
  } catch (err) {
    if (err instanceof EngineError) return state;
    throw err;
  }
}
