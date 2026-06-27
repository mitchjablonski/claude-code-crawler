import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { ShopScreen, isBuyable } from './ShopScreen.js';
import { createRun } from '../../engine/run.js';
import { DEFAULT_RUN_CONFIG, content } from '../../engine/content/index.js';
import type { RunState } from '../../engine/types.js';

const noop = () => undefined;

/**
 * A shop RunState with explicit stock. Gold is set so a chosen card/potion is
 * unaffordable (price > gold) while another is affordable, exercising the
 * affordability dimming (#44) deterministically.
 */
function shop(opts: {
  gold: number;
  stock: { cardId: string; price: number; sold?: boolean }[];
  potionStock?: { potionId: string; price: number; sold?: boolean }[];
}): RunState {
  const base = createRun(content, 'shop-test', DEFAULT_RUN_CONFIG);
  return {
    ...base,
    phase: 'shop',
    gold: opts.gold,
    shop: {
      stock: opts.stock.map((s) => ({ cardId: s.cardId, price: s.price, sold: s.sold ?? false })),
      potionStock: (opts.potionStock ?? []).map((p) => ({
        potionId: p.potionId,
        price: p.price,
        sold: p.sold ?? false,
      })),
    },
  };
}

describe('ShopScreen affordability (#44)', () => {
  // The dimming itself is a `dimColor` style; ink-testing-library renders no
  // ANSI, so the decision is verified through the exported `isBuyable` predicate
  // that drives `dim={!buyable}` (the visual snapshot covers the actual pixels).
  it('treats price > gold as unaffordable (dimmed) and price <= gold as affordable', () => {
    const affordable = { sold: false, price: 10 };
    const unaffordable = { sold: false, price: 100 };
    expect(isBuyable(affordable, 50)).toBe(true); // affordable -> not dimmed
    expect(isBuyable(unaffordable, 50)).toBe(false); // price > gold -> dimmed
    expect(isBuyable({ sold: false, price: 50 }, 50)).toBe(true); // exact gold buys
    expect(isBuyable({ sold: true, price: 1 }, 999)).toBe(false); // sold -> dimmed
    // Potions also need a free satchel slot to be actionable.
    expect(isBuyable({ sold: false, price: 1 }, 999, false)).toBe(false);
  });

  it('renders affordable and unaffordable cards with their prices readable', () => {
    const { lastFrame } = render(
      <ShopScreen
        state={shop({
          gold: 50,
          stock: [
            { cardId: 'rusty-shortsword', price: 10 },
            { cardId: 'guillotine', price: 100 },
          ],
        })}
        content={content}
        dispatch={noop}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Rusty Shortsword');
    expect(frame).toContain('Guillotine');
    // Price stays present/readable on both (the dimmed one keeps its number).
    expect(frame).toContain('10g');
    expect(frame).toContain('100g');
  });

  it('renders an unaffordable potion with its price still shown', () => {
    const potionId = Object.keys(content.potions)[0]!;
    const { lastFrame } = render(
      <ShopScreen
        state={shop({
          gold: 5,
          stock: [{ cardId: 'rusty-shortsword', price: 1 }],
          potionStock: [{ potionId, price: 99 }],
        })}
        content={content}
        dispatch={noop}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain(content.potions[potionId]!.name);
    expect(frame).toContain('99g');
  });
});
