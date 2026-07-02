/**
 * Reward screen tests: real engine reward states (a won combat), keys and
 * clicks mirrored against the engine reducer.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { content } from '@game/engine/content/index.js';
import type { RunState } from '@game/engine/types.js';
import { App } from '../App.js';
import { findPhase } from '../testkit.js';

afterEach(cleanup);
const press = (key: string) => fireEvent.keyDown(window, { key });
const mount = (state: RunState) => render(<App locationSearch="" initialState={state} />);

describe('RewardScreen', () => {
  it('shows the gold haul and the engine-rolled card choices', () => {
    const { state } = findPhase('web-a2-reward', 'reward');
    mount(state);
    const panel = screen.getByLabelText('reward');
    expect(panel.textContent).toContain(`+${state.reward!.gold}g`);
    const tiles = within(screen.getByRole('list', { name: 'card choices' })).getAllByRole('listitem');
    expect(tiles).toHaveLength(state.reward!.cards.length);
    state.reward!.cards.forEach((id, i) => {
      expect(tiles[i]!.textContent).toContain(content.cards[id]!.name);
    });
  });

  it('takes a card with a number key (deck grows, back to map)', () => {
    const { state } = findPhase('web-a2-reward', 'reward');
    mount(state);
    press('1');
    expect(screen.getByLabelText('the map')).toBeTruthy();
    expect(screen.getByLabelText('run status').textContent).toContain(
      `deck ${state.deck.length + 1}`,
    );
  });

  it('takes a card by clicking its tile', () => {
    const { state } = findPhase('web-a2-reward', 'reward');
    mount(state);
    fireEvent.click(
      within(screen.getByRole('list', { name: 'card choices' })).getAllByRole('listitem')[1]!,
    );
    expect(screen.getByLabelText('the map')).toBeTruthy();
    expect(screen.getByLabelText('run status').textContent).toContain(
      `deck ${state.deck.length + 1}`,
    );
  });

  it('skips with [s] (deck unchanged, back to map)', () => {
    const { state } = findPhase('web-a2-reward', 'reward');
    mount(state);
    press('s');
    expect(screen.getByLabelText('the map')).toBeTruthy();
    expect(screen.getByLabelText('run status').textContent).toContain(`deck ${state.deck.length}`);
  });

  it('surfaces a granted relic when the reward carries one (elite loot)', () => {
    const { state } = findPhase(
      'web-a2-relic',
      'reward',
      (s) => s.reward?.relicId !== undefined,
      { prefer: 'elite', seeds: 120 },
    );
    mount(state);
    expect(screen.getByLabelText('reward').textContent).toContain(
      `Relic claimed: ${content.relics[state.reward!.relicId!]!.name}`,
    );
  });
});
