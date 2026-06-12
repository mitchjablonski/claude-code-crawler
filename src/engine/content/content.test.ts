import { describe, expect, it } from 'vitest';
import { DEFAULT_RUN_CONFIG, STARTER_DECK, content } from './index.js';

describe('content quota (REQ-1)', () => {
  it('meets the authored quota', () => {
    expect(Object.keys(content.cards).length).toBeGreaterThanOrEqual(30);
    const enemies = Object.values(content.enemies);
    expect(enemies.length).toBeGreaterThanOrEqual(10);
    expect(enemies.filter((e) => e.isElite).length).toBeGreaterThanOrEqual(2);
    expect(enemies.filter((e) => e.isBoss).length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(content.relics).length).toBeGreaterThanOrEqual(8);
    expect(Object.keys(content.events).length).toBeGreaterThanOrEqual(6);
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
});
