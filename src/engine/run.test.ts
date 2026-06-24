import { describe, expect, it } from 'vitest';
import { applyAction, createRun } from './run.js';
import { legalActions } from '../search/legalActions.js';
import { DEFAULT_RUN_CONFIG, content } from './content/index.js';
import { EngineError } from './types.js';
import type { RunState } from './types.js';

const run = (seed: string) => createRun(content, seed, DEFAULT_RUN_CONFIG);

describe('createRun', () => {
  it('is deterministic per seed', () => {
    expect(run('alpha')).toEqual(run('alpha'));
    expect(run('alpha')).not.toEqual(run('beta'));
  });

  it('defaults enemyHpMult to 1 and scales enemy HP when set', () => {
    expect(run('alpha').enemyHpMult).toBe(1);
    const firstNode = (s: RunState) => s.map.nodes[s.currentNodeId]?.next[0] as string;

    const neutral = createRun(content, 'hpmult', DEFAULT_RUN_CONFIG);
    const scaled = createRun(content, 'hpmult', { ...DEFAULT_RUN_CONFIG, enemyHpMult: 2 });
    const n = applyAction(content, neutral, { type: 'chooseNode', nodeId: firstNode(neutral) });
    const s = applyAction(content, scaled, { type: 'chooseNode', nodeId: firstNode(scaled) });
    const nHp = n.combat?.enemies[0]?.maxHp ?? 0;
    const sHp = s.combat?.enemies[0]?.maxHp ?? 0;
    expect(sHp).toBe(Math.round(nHp * 2)); // same seed roll, scaled after
  });

  it('starts at the map start with the starter deck', () => {
    const state = run('alpha');
    expect(state.phase).toBe('map');
    expect(state.currentNodeId).toBe(state.map.startId);
    expect(state.deck).toHaveLength(DEFAULT_RUN_CONFIG.starterDeck.length);
    expect(state.hp).toBe(DEFAULT_RUN_CONFIG.maxHp);
  });
});

describe('applyAction', () => {
  it('chooseNode follows edges and rejects non-edges', () => {
    const state = run('alpha');
    const first = state.map.nodes[state.currentNodeId]?.next[0] as string;
    const moved = applyAction(content, state, { type: 'chooseNode', nodeId: first });
    expect(moved.currentNodeId).toBe(first);
    expect(moved.phase).toBe('combat'); // row 1 is always combat
    expect(() =>
      applyAction(content, state, { type: 'chooseNode', nodeId: state.map.bossId }),
    ).toThrow(EngineError);
  });

  it('enforces phase guards', () => {
    const state = run('alpha');
    expect(() => applyAction(content, state, { type: 'endTurn' })).toThrow(EngineError);
    expect(() => applyAction(content, state, { type: 'rest' })).toThrow(EngineError);
  });

  it('rest heals 20% of max HP, capped', () => {
    const state: RunState = { ...run('alpha'), phase: 'rest', hp: 10 };
    const rested = applyAction(content, state, { type: 'rest' });
    expect(rested.hp).toBe(10 + Math.floor(70 * 0.2));
    expect(rested.phase).toBe('map');
  });

  it('upgradeCard swaps the deck slot to the upgraded id and returns to the map', () => {
    const base: RunState = {
      ...run('alpha'),
      phase: 'rest',
      deck: ['rusty-shortsword', 'battered-buckler', 'rusty-shortsword'],
    };
    const upgraded = applyAction(content, base, { type: 'upgradeCard', deckIndex: 0 });
    expect(upgraded.deck).toEqual([
      'rusty-shortsword-plus',
      'battered-buckler',
      'rusty-shortsword',
    ]);
    expect(upgraded.phase).toBe('map');
  });

  it('upgradeCard is rest-phase only', () => {
    const onMap: RunState = {
      ...run('alpha'),
      phase: 'map',
      deck: ['rusty-shortsword'],
    };
    expect(() =>
      applyAction(content, onMap, { type: 'upgradeCard', deckIndex: 0 }),
    ).toThrow(EngineError);
  });

  it('upgradeCard rejects an out-of-range deck index', () => {
    const state: RunState = { ...run('alpha'), phase: 'rest', deck: ['rusty-shortsword'] };
    expect(() =>
      applyAction(content, state, { type: 'upgradeCard', deckIndex: 5 }),
    ).toThrow(EngineError);
  });

  it('upgradeCard rejects a card that has no upgrade', () => {
    // adrenaline-rush is authored without an upgradeTo.
    const state: RunState = { ...run('alpha'), phase: 'rest', deck: ['adrenaline-rush'] };
    expect(() =>
      applyAction(content, state, { type: 'upgradeCard', deckIndex: 0 }),
    ).toThrow(EngineError);
  });

  it('reward pick adds the card and returns to the map', () => {
    const state: RunState = {
      ...run('alpha'),
      phase: 'reward',
      reward: { cards: ['lucky-dagger'], gold: 0 },
    };
    const picked = applyAction(content, state, { type: 'pickRewardCard', index: 0 });
    expect(picked.deck).toContain('lucky-dagger');
    expect(picked.phase).toBe('map');
    expect(picked.reward).toBeNull();
  });

  it('buyCard spends gold and marks the slot sold', () => {
    const state: RunState = {
      ...run('alpha'),
      phase: 'shop',
      gold: 100,
      shop: { stock: [{ cardId: 'shield-wall', price: 50, sold: false }], potionStock: [] },
    };
    const bought = applyAction(content, state, { type: 'buyCard', index: 0 });
    expect(bought.gold).toBe(50);
    expect(bought.deck).toContain('shield-wall');
    expect(bought.shop?.stock[0]?.sold).toBe(true);
    expect(() => applyAction(content, bought, { type: 'buyCard', index: 0 })).toThrow(
      EngineError,
    );
  });

  it('usePotion applies effects, consumes the potion, and is combat-only', () => {
    const base = run('alpha');
    const first = base.map.nodes[base.currentNodeId]?.next[0] as string;
    const inCombat = applyAction(content, base, { type: 'chooseNode', nodeId: first });
    expect(inCombat.phase).toBe('combat');
    const armed: RunState = { ...inCombat, potions: ['iron-tonic'] };
    const used = applyAction(content, armed, { type: 'usePotion', potionIndex: 0 });
    expect(used.combat?.playerBlock).toBe(12); // Iron Tonic = 12 block
    expect(used.potions).toHaveLength(0); // consumed

    // Out of combat the action is rejected.
    expect(() =>
      applyAction(content, { ...base, potions: ['iron-tonic'] }, {
        type: 'usePotion',
        potionIndex: 0,
      }),
    ).toThrow(EngineError);
    // Unknown index rejected.
    expect(() =>
      applyAction(content, armed, { type: 'usePotion', potionIndex: 5 }),
    ).toThrow(EngineError);
  });

  it('buyPotion deducts gold, fills a slot, and respects sold/full', () => {
    const state: RunState = {
      ...run('alpha'),
      phase: 'shop',
      gold: 100,
      potions: [],
      maxPotions: 1,
      shop: {
        stock: [],
        potionStock: [{ potionId: 'fire-flask', price: 35, sold: false }],
      },
    };
    const bought = applyAction(content, state, { type: 'buyPotion', index: 0 });
    expect(bought.gold).toBe(65);
    expect(bought.potions).toEqual(['fire-flask']);
    expect(bought.shop?.potionStock[0]?.sold).toBe(true);
    // Already sold -> reject.
    expect(() => applyAction(content, bought, { type: 'buyPotion', index: 0 })).toThrow(
      EngineError,
    );
    // Full satchel (maxPotions 1) -> reject even on a fresh unsold slot.
    const full: RunState = {
      ...state,
      potions: ['healing-draught'],
    };
    expect(() => applyAction(content, full, { type: 'buyPotion', index: 0 })).toThrow(
      EngineError,
    );
  });

  it('reward potion grant respects the slot limit', () => {
    const room: RunState = {
      ...run('alpha'),
      phase: 'reward',
      potions: [],
      maxPotions: 2,
      reward: { cards: ['lucky-dagger'], gold: 0, potionId: 'fire-flask' },
    };
    const picked = applyAction(content, room, { type: 'pickRewardCard', index: 0 });
    expect(picked.potions).toEqual(['fire-flask']);

    const full: RunState = {
      ...room,
      potions: ['healing-draught', 'iron-tonic'],
    };
    const skipped = applyAction(content, full, { type: 'skipReward' });
    expect(skipped.potions).toHaveLength(2); // unchanged, no overflow
  });

  it('event outcomes apply via a result screen, then continue returns to map', () => {
    const base = run('alpha');
    const shrine: RunState = {
      ...base,
      phase: 'event',
      event: { eventId: 'shrine-of-the-crawl' },
    };
    // Choosing an option that applies outcomes shows a result, not the map.
    const prayed = applyAction(content, shrine, { type: 'chooseEventOption', index: 0 });
    expect(prayed.maxHp).toBe(base.maxHp + 6);
    expect(prayed.hp).toBe(base.hp + 6);
    expect(prayed.phase).toBe('event');
    expect(prayed.event?.result?.applied).toEqual([{ kind: 'gainMaxHp', amount: 6 }]);
    expect(prayed.event?.result?.rolled).toBe(false);

    // Continue clears the event and returns to the map.
    const after = applyAction(content, prayed, { type: 'continueEvent' });
    expect(after.phase).toBe('map');
    expect(after.event).toBeNull();
  });

  it('lethal event outcomes end the run with no result screen', () => {
    const base = run('alpha');
    const shrine: RunState = {
      ...base,
      phase: 'event',
      event: { eventId: 'shrine-of-the-crawl' },
      hp: 3,
    };
    // "Pry up the offerings" costs 5 HP → lethal at 3 HP.
    const looted = applyAction(content, shrine, { type: 'chooseEventOption', index: 1 });
    expect(looted.phase).toBe('defeat');
    expect(looted.event).toBeNull();
  });

  it('an empty-outcome option (Walk away) goes straight to the map', () => {
    const base = run('alpha');
    const vending: RunState = {
      ...base,
      phase: 'event',
      event: { eventId: 'abandoned-vending-machine' },
    };
    // Option 2 (index 2) is "Walk away" with no outcomes.
    const left = applyAction(content, vending, { type: 'chooseEventOption', index: 2 });
    expect(left.phase).toBe('map');
    expect(left.event).toBeNull();
  });

  it('rollOutcomes is deterministic per seed and varies across seeds', () => {
    const onVending = (seed: string): RunState => ({
      ...run(seed),
      phase: 'event',
      event: { eventId: 'abandoned-vending-machine' },
    });
    const resolve = (s: RunState) =>
      applyAction(content, s, { type: 'chooseEventOption', index: 0 }).event?.result?.applied;

    // Same seed → identical branch.
    const a1 = resolve(onVending('roll-seed-A'));
    const a2 = resolve(onVending('roll-seed-A'));
    expect(a1).toEqual(a2);
    // The result is flagged as rolled.
    const rolledState = applyAction(content, onVending('roll-seed-A'), {
      type: 'chooseEventOption',
      index: 0,
    });
    expect(rolledState.event?.result?.rolled).toBe(true);

    // Different seeds can pick different branches across the kick event.
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      seen.add(JSON.stringify(resolve(onVending(`roll-vary-${i}`))));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('conditional outcomes branch on player state (ifPass vs ifFail)', () => {
    const base = run('alpha');
    const idol = (relics: readonly string[]): RunState => ({
      ...base,
      phase: 'event',
      event: { eventId: 'cursed-idol' },
      relics: [...relics],
    });
    // < 3 relics → heavy bite (ifFail: lose 9 HP).
    const poor = applyAction(content, idol([]), { type: 'chooseEventOption', index: 0 });
    expect(poor.event?.result?.applied).toContainEqual({ kind: 'loseHp', amount: 9 });
    // >= 3 relics → warded (ifPass: lose only 2 HP).
    const rich = applyAction(content, idol(['whetstone', 'lucky-coin', 'troll-tooth']), {
      type: 'chooseEventOption',
      index: 0,
    });
    expect(rich.event?.result?.applied).toContainEqual({ kind: 'loseHp', amount: 2 });
  });

  it('a stat-gated option is excluded from legalActions unless affordable', () => {
    const base = run('alpha');
    const toll = (gold: number): RunState => ({
      ...base,
      phase: 'event',
      event: { eventId: 'goblin-toll-booth' },
      gold,
    });
    // Option 0 "Pay the toll" requires 30 gold.
    const poor = legalActions(content, toll(10));
    expect(poor).not.toContainEqual({ type: 'chooseEventOption', index: 0 });
    const rich = legalActions(content, toll(50));
    expect(rich).toContainEqual({ type: 'chooseEventOption', index: 0 });
    // Dispatching the gated option while unaffordable throws.
    expect(() => applyAction(content, toll(10), { type: 'chooseEventOption', index: 0 })).toThrow();
  });

  it('continueEvent is the only legal action while a result is showing', () => {
    const base = run('alpha');
    const shrine: RunState = {
      ...base,
      phase: 'event',
      event: { eventId: 'shrine-of-the-crawl' },
    };
    const prayed = applyAction(content, shrine, { type: 'chooseEventOption', index: 0 });
    expect(legalActions(content, prayed)).toEqual([{ type: 'continueEvent' }]);
  });
});
