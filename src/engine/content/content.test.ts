import { describe, expect, it } from 'vitest';
import { CHARACTERS, DEFAULT_RUN_CONFIG, STARTER_DECK, content } from './index.js';
import { UPGRADE_TARGET_IDS } from './cards.js';

/**
 * Re-derive the draftable pool the way run.ts's rollCardChoices builds it:
 * non-starter cards that are NOT some card's upgradeTo target.
 */
function draftablePool(): string[] {
  return Object.values(content.cards)
    .filter((c) => c.rarity !== 'starter' && !UPGRADE_TARGET_IDS.has(c.id))
    .map((c) => c.id);
}

describe('content quota (REQ-1)', () => {
  it('meets the authored quota', () => {
    expect(Object.keys(content.cards).length).toBeGreaterThanOrEqual(50);
    const enemies = Object.values(content.enemies);
    expect(enemies.length).toBeGreaterThanOrEqual(18);
    expect(enemies.filter((e) => e.isElite).length).toBeGreaterThanOrEqual(2);
    expect(enemies.filter((e) => e.isBoss).length).toBeGreaterThanOrEqual(1);
    // tiered normal enemies exist for act escalation
    expect(enemies.filter((e) => (e.tier ?? 1) >= 2).length).toBeGreaterThanOrEqual(4);
    expect(Object.keys(content.relics).length).toBeGreaterThanOrEqual(12);
    expect(Object.keys(content.events).length).toBeGreaterThanOrEqual(10);
    expect(Object.keys(content.potions).length).toBeGreaterThanOrEqual(6);
  });
});

describe('content integrity', () => {
  it('has no dangling ids in events', () => {
    for (const event of Object.values(content.events)) {
      for (const option of event.options) {
        for (const outcome of option.outcomes) {
          if (outcome.kind === 'gainCard') {
            expect(content.cards[outcome.cardId], `${event.id}: ${outcome.cardId}`).toBeDefined();
          }
          if (outcome.kind === 'gainRelic') {
            expect(content.relics[outcome.relicId], `${event.id}: ${outcome.relicId}`).toBeDefined();
          }
        }
      }
    }
  });

  it('every upgradeTo references a real card (and the base/target differ)', () => {
    for (const card of Object.values(content.cards)) {
      if (card.upgradeTo === undefined) continue;
      expect(content.cards[card.upgradeTo], `${card.id} -> ${card.upgradeTo}`).toBeDefined();
      expect(card.upgradeTo).not.toBe(card.id);
    }
  });

  it('upgraded variants are not themselves upgradeable (no chains/cycles)', () => {
    for (const targetId of UPGRADE_TARGET_IDS) {
      const target = content.cards[targetId];
      expect(target, targetId).toBeDefined();
      // An upgrade target must not carry its own upgradeTo (no chains), which
      // also rules out any A<->B cycle.
      expect(target?.upgradeTo, `${targetId} should be terminal`).toBeUndefined();
    }
  });

  it('a meaningful subset of cards is upgradeable', () => {
    // All starters + commons + a handful of uncommon/rare were authored.
    expect(UPGRADE_TARGET_IDS.size).toBeGreaterThanOrEqual(15);
  });

  it('no upgraded variant is draftable (excluded from the reward/shop pool)', () => {
    const pool = new Set(draftablePool());
    for (const targetId of UPGRADE_TARGET_IDS) {
      expect(pool.has(targetId), `${targetId} must not be draftable`).toBe(false);
    }
    // Sanity: the pool is still non-empty after exclusion.
    expect(pool.size).toBeGreaterThan(0);
  });

  it('every character kit resolves to real cards and relics', () => {
    const ids = Object.keys(CHARACTERS);
    expect(ids).toContain('knight');
    expect(ids).toContain('apothecary');
    for (const c of Object.values(CHARACTERS)) {
      expect(c.starterDeck.length).toBeGreaterThan(0);
      for (const id of c.starterDeck) expect(content.cards[id], `${c.id}:${id}`).toBeDefined();
      for (const id of c.startingRelics) expect(content.relics[id], `${c.id}:${id}`).toBeDefined();
      expect(c.maxHp).toBeGreaterThan(0);
    }
  });

  it('starter deck and starting relics resolve', () => {
    for (const id of STARTER_DECK) expect(content.cards[id], id).toBeDefined();
    for (const id of DEFAULT_RUN_CONFIG.startingRelics) {
      expect(content.relics[id], id).toBeDefined();
    }
  });

  it('cards and enemies stay within sane bounds', () => {
    for (const card of Object.values(content.cards)) {
      expect(card.cost, card.id).toBeGreaterThanOrEqual(0);
      expect(card.cost, card.id).toBeLessThanOrEqual(3);
      expect(card.effects.length, card.id).toBeGreaterThan(0);
      expect(card.id).toMatch(/^[a-z0-9-]+$/);
    }
    for (const enemy of Object.values(content.enemies)) {
      expect(enemy.hp[0], enemy.id).toBeLessThanOrEqual(enemy.hp[1]);
      expect(enemy.hp[0], enemy.id).toBeGreaterThan(0);
      expect(enemy.moves.length, enemy.id).toBeGreaterThan(0);
    }
    for (const relic of Object.values(content.relics)) {
      expect(relic.effects.length, relic.id).toBeGreaterThan(0);
    }
  });

  it('potions compose only valid effect kinds/targets', () => {
    const KINDS = ['damage', 'block', 'draw', 'gainEnergy', 'heal', 'applyStatus'];
    const TARGETS = ['enemy', 'allEnemies', 'self'];
    const STATUSES = ['strength', 'vulnerable', 'weak', 'regen', 'poison', 'dexterity'];
    for (const potion of Object.values(content.potions)) {
      expect(potion.id).toMatch(/^[a-z0-9-]+$/);
      expect(potion.effects.length, potion.id).toBeGreaterThan(0);
      expect(TARGETS, potion.id).toContain(potion.target);
      for (const fx of potion.effects) {
        expect(KINDS, `${potion.id}:${fx.kind}`).toContain(fx.kind);
        if ('target' in fx) expect(TARGETS, potion.id).toContain(fx.target);
        if (fx.kind === 'applyStatus') {
          expect(STATUSES, `${potion.id}:${fx.status}`).toContain(fx.status);
        }
      }
      // An enemy-target potion must actually carry an enemy-directed effect.
      if (potion.target !== 'self') {
        expect(
          potion.effects.some((fx) => 'target' in fx && fx.target !== 'self'),
          potion.id,
        ).toBe(true);
      }
    }
  });
});
