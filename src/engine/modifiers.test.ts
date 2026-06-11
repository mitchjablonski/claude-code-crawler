import { describe, expect, it } from 'vitest';
import { applyModifier, MAX_BLESS_STACKS, MAX_QUEUED_ELITES } from './modifiers.js';
import { applyAction, createRun } from './run.js';
import { DEFAULT_RUN_CONFIG, content } from './content/index.js';
import type { RunState } from './types.js';

const fresh = () => createRun(content, 'mods-test', DEFAULT_RUN_CONFIG);

describe('applyModifier', () => {
  it('lootRoll grants bounded gold deterministically and advances only the modifiers stream', () => {
    const state = fresh();
    const a = applyModifier(content, state, { kind: 'lootRoll', size: 'big' });
    const b = applyModifier(content, state, { kind: 'lootRoll', size: 'big' });
    expect(a.gold).toBe(b.gold); // deterministic
    expect(a.gold - state.gold).toBeGreaterThanOrEqual(8);
    expect(a.gold - state.gold).toBeLessThanOrEqual(15);
    expect(a.rng.modifiers).not.toBe(state.rng.modifiers);
    expect(a.rng.combat).toBe(state.rng.combat);
    expect(a.rng.loot).toBe(state.rng.loot);
  });

  it('healPlayer clamps to MAX_HEAL and max HP', () => {
    const hurt: RunState = { ...fresh(), hp: 30 };
    expect(applyModifier(content, hurt, { kind: 'healPlayer', amount: 5 }).hp).toBe(35);
    expect(applyModifier(content, hurt, { kind: 'healPlayer', amount: 999 }).hp).toBe(40);
    const full = fresh();
    expect(applyModifier(content, full, { kind: 'healPlayer', amount: 5 }).hp).toBe(full.maxHp);
  });

  it('queueElite caps the queue and ignores unknown enemies', () => {
    let state = fresh();
    for (let i = 0; i < 5; i++) {
      state = applyModifier(content, state, { kind: 'queueElite', enemyId: 'lint-goblin' });
    }
    expect(state.modifiers.queuedEliteIds).toHaveLength(MAX_QUEUED_ELITES);
    const before = state.modifiers.queuedEliteIds;
    state = applyModifier(content, state, { kind: 'queueElite', enemyId: 'no-such-enemy' });
    expect(state.modifiers.queuedEliteIds).toEqual(before);
  });

  it('a queued elite joins the next combat encounter and is consumed', () => {
    let state = applyModifier(content, fresh(), {
      kind: 'queueElite',
      enemyId: 'lint-goblin',
    });
    const firstNode = state.map.nodes[state.currentNodeId]?.next[0] as string;
    state = applyAction(content, state, { type: 'chooseNode', nodeId: firstNode });
    expect(state.phase).toBe('combat');
    expect(state.combat?.enemies.some((e) => e.defId === 'lint-goblin')).toBe(true);
    expect(state.modifiers.queuedEliteIds).toHaveLength(0);
  });

  it('blessNextCombat caps stacks, applies at combat start, then clears', () => {
    let state = fresh();
    state = applyModifier(content, state, { kind: 'blessNextCombat', status: 'strength', stacks: 2 });
    state = applyModifier(content, state, { kind: 'blessNextCombat', status: 'strength', stacks: 9 });
    expect(state.modifiers.nextCombatStatuses.strength).toBe(MAX_BLESS_STACKS);

    const firstNode = state.map.nodes[state.currentNodeId]?.next[0] as string;
    state = applyAction(content, state, { type: 'chooseNode', nodeId: firstNode });
    expect(state.combat?.playerStatuses.strength).toBe(MAX_BLESS_STACKS);
    expect(state.modifiers.nextCombatStatuses).toEqual({});
  });

  it('is a no-op mid-combat and after the run ends', () => {
    let state = fresh();
    const firstNode = state.map.nodes[state.currentNodeId]?.next[0] as string;
    state = applyAction(content, state, { type: 'chooseNode', nodeId: firstNode });
    expect(applyModifier(content, state, { kind: 'lootRoll', size: 'big' })).toBe(state);

    const done: RunState = { ...fresh(), phase: 'victory' };
    expect(applyModifier(content, done, { kind: 'healPlayer', amount: 5 })).toBe(done);
  });
});
