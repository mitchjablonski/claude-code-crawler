/**
 * Shop screen tests: real engine shop states; affordability dimming, inline
 * service reasons, buy/remove/leave — keys and clicks, engine-mirrored.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { content } from '@game/engine/content/index.js';
import { SHOP_REMOVAL_COST } from '@game/engine/run.js';
import type { RunState } from '@game/engine/types.js';
import { App } from '../App.js';
import { findPhase } from '../testkit.js';
import { isBuyable, canRemove } from './ShopScreen.js';

afterEach(cleanup);
const press = (key: string) => fireEvent.keyDown(window, { key });
const mount = (state: RunState) => render(<App locationSearch="" initialState={state} />);

describe('ShopScreen', () => {
  it('lists the engine stock with prices; dimming matches isBuyable', () => {
    const { state } = findPhase('web-a2-shop', 'shop');
    mount(state);
    const rows = within(screen.getByRole('list', { name: 'card stock' })).getAllByRole('listitem');
    expect(rows).toHaveLength(state.shop!.stock.length);
    state.shop!.stock.forEach((item, i) => {
      expect(rows[i]!.textContent).toContain(content.cards[item.cardId]!.name);
      expect(rows[i]!.textContent).toContain(item.sold ? '(sold)' : `${item.price}g`);
      expect(rows[i]!.getAttribute('aria-disabled')).toBe(String(!isBuyable(item, state.gold)));
    });
  });

  it('buys a card by clicking its row (gold falls by the price)', () => {
    const { state } = findPhase(
      'web-a2-shop-buy',
      'shop',
      (s) => s.shop!.stock.some((item) => isBuyable(item, s.gold)),
      { seeds: 80 },
    );
    const index = state.shop!.stock.findIndex((item) => isBuyable(item, state.gold));
    mount(state);
    fireEvent.click(
      within(screen.getByRole('list', { name: 'card stock' })).getAllByRole('listitem')[index]!,
    );
    expect(screen.getByLabelText('run status').textContent).toContain(
      `${state.gold - state.shop!.stock[index]!.price}g`,
    );
    expect(screen.getAllByText('(sold)').length).toBeGreaterThan(0);
  });

  it('clicking an unaffordable row is a guarded no-op', () => {
    const { state } = findPhase('web-a2-shop', 'shop');
    const broke: RunState = { ...state, gold: 0 };
    mount(broke);
    const rows = within(screen.getByRole('list', { name: 'card stock' })).getAllByRole('listitem');
    fireEvent.click(rows[0]!);
    // Still in the shop, still 0g — nothing was bought.
    expect(screen.getByLabelText('the shop')).toBeTruthy();
    expect(screen.getByLabelText('run status').textContent).toContain('0g');
  });

  it('removes a card via the [r] service (one per visit, engine-priced)', () => {
    const { state } = findPhase('web-a2-shop', 'shop', (s) => canRemove(s), { seeds: 80 });
    mount(state);
    press('r');
    expect(screen.getByLabelText('remove a card')).toBeTruthy();
    press('1');
    // Back in the shop; deck thinned by one, gold down by the removal cost.
    expect(screen.getByLabelText('the shop')).toBeTruthy();
    const hud = screen.getByLabelText('run status').textContent;
    expect(hud).toContain(`deck ${state.deck.length - 1}`);
    expect(hud).toContain(`${state.gold - SHOP_REMOVAL_COST}g`);
    // The service is now spent, with the inline reason.
    expect(screen.getByText(/\(already used\)/)).toBeTruthy();
  });

  it('shows the (need more gold) reason and blocks [r] when broke', () => {
    const { state } = findPhase('web-a2-shop', 'shop');
    const broke: RunState = { ...state, gold: 0 };
    mount(broke);
    expect(screen.getByText(/\(need more gold\)/)).toBeTruthy();
    press('r');
    // The chooser never opens.
    expect(screen.queryByLabelText('remove a card')).toBeNull();
    expect(screen.getByLabelText('the shop')).toBeTruthy();
  });

  it('leaves with [l] back to the map', () => {
    const { state } = findPhase('web-a2-shop', 'shop');
    mount(state);
    press('l');
    expect(screen.getByLabelText('the map')).toBeTruthy();
  });
});
