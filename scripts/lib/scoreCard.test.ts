import { describe, expect, it } from 'vitest';
import { scoreCard } from './scoreCard.js';
import { cards } from '../../src/engine/content/cards.js';
import type { CardDef } from '../../src/engine/types.js';

// Tooling-only unit tests for the #39 draft scorer. The scorer is a pure,
// deterministic estimate of a card's draft strength used by the playtest
// harness so greedy stops picking reward cards blind. These tests pin the
// properties the harness relies on: rarity dominance, value/efficiency, and
// determinism — NOT exact magnitudes (those are free to be tuned).
describe('scoreCard', () => {
  it('is deterministic (same input -> same score)', () => {
    const c = cards['goblin-stomp'] as CardDef;
    expect(scoreCard(c)).toBe(scoreCard(c));
    const ctx = { deck: ['rusty-shortsword', 'battered-buckler'], cards };
    expect(scoreCard(c, ctx)).toBe(scoreCard(c, ctx));
  });

  it('scores a rare above a common of equal cost', () => {
    // Build a rare and a common with identical effects + cost so ONLY rarity
    // differs — the rarity weight must break the tie upward.
    const common: CardDef = {
      id: 't-common',
      name: 'T Common',
      description: '',
      type: 'attack',
      rarity: 'common',
      cost: 2,
      target: 'enemy',
      effects: [{ kind: 'damage', amount: 10, target: 'enemy' }],
    };
    const rare: CardDef = { ...common, id: 't-rare', rarity: 'rare' };
    expect(scoreCard(rare)).toBeGreaterThan(scoreCard(common));
  });

  it('scores a high-value efficient card above a dead-weight one', () => {
    // guillotine: 24 dmg / 3 cost, rare — strong. A "dead" card: tiny effect at
    // the same rarity/cost must score far lower.
    const guillotine = cards['guillotine'] as CardDef;
    const dead: CardDef = {
      id: 't-dead',
      name: 'Dead Weight',
      description: '',
      type: 'attack',
      rarity: 'rare',
      cost: 3,
      target: 'enemy',
      effects: [{ kind: 'damage', amount: 2, target: 'enemy' }],
    };
    expect(scoreCard(guillotine)).toBeGreaterThan(scoreCard(dead));
  });

  it('rewards cost efficiency: same value at lower cost scores higher', () => {
    const cheap: CardDef = {
      id: 't-cheap',
      name: 'Cheap',
      description: '',
      type: 'skill',
      rarity: 'common',
      cost: 1,
      target: 'self',
      effects: [{ kind: 'block', amount: 8 }],
    };
    const pricey: CardDef = { ...cheap, id: 't-pricey', cost: 3 };
    expect(scoreCard(cheap)).toBeGreaterThan(scoreCard(pricey));
  });

  it('values AoE damage above the same single-target damage', () => {
    const single: CardDef = {
      id: 't-single',
      name: 'Single',
      description: '',
      type: 'attack',
      rarity: 'common',
      cost: 1,
      target: 'enemy',
      effects: [{ kind: 'damage', amount: 6, target: 'enemy' }],
    };
    const aoe: CardDef = {
      ...single,
      id: 't-aoe',
      target: 'allEnemies',
      effects: [{ kind: 'damage', amount: 6, target: 'allEnemies' }],
    };
    expect(scoreCard(aoe)).toBeGreaterThan(scoreCard(single));
  });
});
