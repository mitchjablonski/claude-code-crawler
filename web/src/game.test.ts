/**
 * runConfigFor must assemble the SAME config the terminal does — the neutral
 * (Knight / normal / single) case has to match the engine's DEFAULT_RUN_CONFIG
 * on every shared field, so a web run and a terminal run of the same seed are
 * the same run.
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_RUN_CONFIG, CHARACTERS } from '@game/engine/content/index.js';
import { createRun, applyAction } from '@game/engine/run.js';
import { content } from '@game/engine/content/index.js';
import { knobsFor } from '@game/difficulty.js';
import { runConfigFor, stepRun } from './game.js';

describe('runConfigFor', () => {
  it('neutral knight config matches DEFAULT_RUN_CONFIG on shared fields', () => {
    const cfg = runConfigFor('knight', 'normal', 'single');
    expect(cfg.starterDeck).toEqual(DEFAULT_RUN_CONFIG.starterDeck);
    expect(cfg.startingRelics).toEqual(DEFAULT_RUN_CONFIG.startingRelics);
    expect(cfg.maxHp).toBe(DEFAULT_RUN_CONFIG.maxHp);
    expect(cfg.startingGold).toBe(DEFAULT_RUN_CONFIG.startingGold);
    expect(cfg.enemyHpMult).toBe(1);
    expect(cfg.eventLoseHpMult).toBe(1);
    expect(cfg.acts).toBe(1);
  });

  it('threads class and difficulty/mode knobs like the terminal shell', () => {
    const cfg = runConfigFor('warlock', 'nightmare', 'arc');
    const k = knobsFor('nightmare', 'arc');
    expect(cfg.starterDeck).toEqual(CHARACTERS['warlock']!.starterDeck);
    expect(cfg.maxHp).toBe(CHARACTERS['warlock']!.maxHp);
    expect(cfg.enemyHpMult).toBe(k.enemyHpMult);
    expect(cfg.actHpRamp).toEqual(k.actHpRamp);
    expect(cfg.eventLoseHpMult).toBe(k.eventLoseHpMult);
    expect(cfg.acts).toBe(4);
  });

  it('same seed + neutral config replays byte-identically (engine determinism)', () => {
    const a = createRun(content, 'web-parity', runConfigFor('knight', 'normal', 'single'));
    const b = createRun(content, 'web-parity', runConfigFor('knight', 'normal', 'single'));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const first = a.map.nodes[a.currentNodeId]!.next[0]!;
    const a2 = applyAction(content, a, { type: 'chooseNode', nodeId: first });
    const b2 = applyAction(content, b, { type: 'chooseNode', nodeId: first });
    expect(JSON.stringify(a2)).toBe(JSON.stringify(b2));
  });

  it('threads earned unlocks like the terminal: present when earned, ABSENT when empty', () => {
    // Empty => the key is omitted entirely (core-only pool, byte-identical to
    // a fresh terminal profile).
    expect('allowedUnlockIds' in runConfigFor('knight', 'normal', 'single')).toBe(false);
    expect(runConfigFor('knight', 'normal', 'single', []).allowedUnlockIds).toBeUndefined();
    expect(
      runConfigFor('knight', 'normal', 'single', ['heroic-second-wind']).allowedUnlockIds,
    ).toEqual(['heroic-second-wind']);
  });
});

describe('stepRun (the web dispatch reducer)', () => {
  it('applies a legal action through the shared engine', () => {
    const start = createRun(content, 'web-step', runConfigFor('knight', 'normal', 'single'));
    const nodeId = start.map.nodes[start.currentNodeId]!.next[0]!;
    const next = stepRun(start, { type: 'chooseNode', nodeId });
    expect(next).toEqual(applyAction(content, start, { type: 'chooseNode', nodeId }));
  });

  it('treats invalid input as a NO-OP (same reference back), never a crash', () => {
    const start = createRun(content, 'web-step', runConfigFor('knight', 'normal', 'single'));
    expect(stepRun(start, { type: 'chooseNode', nodeId: '__nope__' })).toBe(start);
    expect(stepRun(start, { type: 'endTurn' })).toBe(start); // not in combat
  });
});
