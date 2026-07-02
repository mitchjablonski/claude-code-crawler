/**
 * REQ-3 — cross-client determinism parity. ONE recorded action script is
 * driven through the reducer exactly as each client dispatches it:
 *
 *   - the TERMINAL path: the real `useGame` hook (the Ink app's game state
 *     owner — createRun on newRun, applyAction per dispatch, EngineError as a
 *     no-op, save/record through a SaveStore), mounted via renderHook;
 *   - the WEB path: `stepRun`, the exact reducer function the web App shell
 *     dispatches through (same no-op rule), folded over the same script.
 *
 * The final RunStates must be DEEP-EQUAL — same seed, same script, same run,
 * regardless of which client played it. The script is recorded ONCE from the
 * deterministic testkit policy and includes deliberately invalid actions to
 * prove the no-op rule matches too. Also asserts both clients would persist
 * the same thing: the run each side saved at the last safe boundary matches.
 */
import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useGame } from '@game/ui/useGame.js';
import { createRun } from '@game/engine/run.js';
import { content } from '@game/engine/content/index.js';
import type { GameAction, RunState } from '@game/engine/types.js';
import type { SaveStore } from '@game/persistence/saves.js';
import {
  appendRun,
  EMPTY_META,
  mergeSettings,
  type MetaState,
  type SavedRun,
} from '@game/persistence/format.js';
import { runConfigFor, stepRun } from './game.js';
import { policyAction } from './testkit.js';

const SEED = 'req3-parity';
const CONFIG = runConfigFor('knight', 'normal', 'single');

/** An action that is invalid in EVERY phase (exercises the no-op rule). */
const BOGUS: GameAction = { type: 'chooseNode', nodeId: '__no-such-node__' };

/**
 * Record the script ONCE against the pure engine: the deterministic policy's
 * action at every step, with a bogus action injected every few steps. The
 * recording notes only the ACTIONS — both clients then replay them blind.
 */
function recordScript(): { script: GameAction[]; final: RunState } {
  let state = createRun(content, SEED, CONFIG);
  const script: GameAction[] = [];
  for (let i = 0; i < 2000; i++) {
    if (state.phase === 'victory' || state.phase === 'defeat') break;
    if (i % 5 === 4) {
      script.push(BOGUS); // must be a no-op on both clients
      state = stepRun(state, BOGUS);
    }
    const action = policyAction(state);
    if (!action) break;
    script.push(action);
    state = stepRun(state, action);
  }
  return { script, final: state };
}

/** In-memory SaveStore so the real useGame persistence cadence runs untouched. */
function memoryStore(): SaveStore & { readonly savedRuns: RunState[] } {
  let run: SavedRun | null = null;
  let meta: MetaState = EMPTY_META;
  const savedRuns: RunState[] = [];
  return {
    savedRuns,
    loadRun: () => run,
    saveRun(state) {
      run = { state, savedAt: 0 };
      savedRuns.push(state);
    },
    clearRun() {
      run = null;
    },
    loadMeta: () => meta,
    recordRun(record) {
      meta = appendRun(meta, record);
    },
    updateSettings(settings) {
      meta = mergeSettings(meta, settings);
    },
  };
}

describe('cross-client determinism parity (REQ-3)', () => {
  it('one recorded script through useGame and through the web reducer ends deep-equal', () => {
    const { script, final } = recordScript();
    expect(script.length).toBeGreaterThan(20);
    expect(['victory', 'defeat']).toContain(final.phase);

    // TERMINAL client: the real Ink-side hook, real dispatch, real store cadence.
    const store = memoryStore();
    const { result } = renderHook(() =>
      useGame({
        store,
        seed: SEED,
        runConfig: CONFIG,
        now: () => 0,
        difficulty: 'normal',
        runMode: 'single',
        character: 'knight',
      }),
    );
    act(() => result.current.newRun());
    for (const action of script) {
      act(() => result.current.dispatch(action));
    }
    const terminalFinal = result.current.state;

    // WEB client: the exact reducer the App shell dispatches through.
    let webFinal = createRun(content, SEED, CONFIG);
    const webSaved: RunState[] = [webFinal]; // web saves the fresh run at [n] too
    for (const action of script) {
      const next = stepRun(webFinal, action);
      if (
        next !== webFinal &&
        next.phase !== 'victory' &&
        next.phase !== 'defeat' &&
        next.phase !== 'combat'
      ) {
        webSaved.push(next); // the shell's safe-boundary autosave mirror
      }
      webFinal = next;
    }

    // THE assertion: same script, same final run — byte-for-byte.
    expect(terminalFinal).toEqual(webFinal);
    expect(terminalFinal).toEqual(final);

    // And both clients persisted the same trail: every state the terminal
    // store saved is exactly what the web cadence would have saved.
    expect(store.savedRuns).toEqual(webSaved);

    // The finished run was recorded identically (seed + outcome).
    const meta = store.loadMeta();
    expect(meta.runs).toHaveLength(1);
    expect(meta.runs[0]).toMatchObject({ seed: SEED, outcome: webFinal.phase });
  });

  it('the bogus action is a NO-OP on both clients (EngineError parity)', () => {
    const start = createRun(content, SEED, CONFIG);
    // Web reducer: same reference back.
    expect(stepRun(start, BOGUS)).toBe(start);

    // Terminal hook: state unchanged after dispatching the same bogus action.
    const { result } = renderHook(() =>
      useGame({ store: memoryStore(), seed: SEED, runConfig: CONFIG, now: () => 0 }),
    );
    act(() => result.current.newRun());
    const before = result.current.state;
    act(() => result.current.dispatch(BOGUS));
    expect(result.current.state).toBe(before);
  });
});
