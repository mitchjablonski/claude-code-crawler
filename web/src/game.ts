/**
 * Run-config assembly for the web shell. PRESENTATION + DISPATCH ONLY: this is
 * the exact mapping the terminal `App.tsx` does in its `runConfig` memo
 * (class -> starter deck/relics/maxHp, difficulty+mode -> knobs), built from the
 * SAME shared modules. No gameplay logic lives web-side — the engine reducer
 * (`createRun`/`applyAction`) decides everything.
 *
 * A1 note: the terminal also threads `allowedUnlockIds` (E2 meta-progression
 * derived from saved run history). The web client has no persistence yet, so a
 * web run always uses the core pool — byte-identical to a fresh terminal
 * profile. Web persistence/unlocks are an A2+ concern.
 */
import type { RunConfig } from '@game/engine/run.js';
import { CHARACTERS, DEFAULT_CHARACTER } from '@game/engine/content/index.js';
import { knobsFor, actsForMode, type Difficulty, type RunMode } from '@game/difficulty.js';

export function runConfigFor(
  characterId: string,
  difficulty: Difficulty,
  runMode: RunMode,
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
  };
}
