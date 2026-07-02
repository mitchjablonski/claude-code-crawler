/**
 * Rest-site tests: real engine rest states; the computed heal number, the
 * upgrade chooser's was->now diff, keys and clicks, engine-mirrored.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { applyAction } from '@game/engine/run.js';
import { content } from '@game/engine/content/index.js';
import type { RunState } from '@game/engine/types.js';
import { App } from '../App.js';
import { findPhase } from '../testkit.js';
import { upgradeable } from './RestScreen.js';

afterEach(cleanup);
const press = (key: string) => fireEvent.keyDown(window, { key });
const mount = (state: RunState) => render(<App locationSearch="" initialState={state} />);

describe('RestScreen', () => {
  it('shows the engine heal amount and the upgradeable count', () => {
    const { state } = findPhase('web-a2-rest', 'rest');
    mount(state);
    const panel = screen.getByLabelText('the rest site');
    expect(panel.textContent).toContain(`Rest (heal ${Math.floor(state.maxHp * 0.2)} HP)`);
    expect(panel.textContent).toContain(`(${upgradeable(state, content).length} upgradeable)`);
  });

  it('rests with [r]: HP rises exactly as the engine says', () => {
    const { state } = findPhase('web-a2-rest', 'rest', (s) => s.hp < s.maxHp, { seeds: 80 });
    const after = applyAction(content, state, { type: 'rest' });
    expect(after.hp).toBeGreaterThan(state.hp);
    mount(state);
    press('r');
    expect(screen.getByLabelText('the map')).toBeTruthy();
    expect(screen.getByLabelText('run status').textContent).toContain(
      `HP ${after.hp}/${after.maxHp}`,
    );
  });

  it('upgrades a card: chooser shows the was->now diff, deck gains the -plus id', () => {
    const { state } = findPhase('web-a2-rest', 'rest', (s) => upgradeable(s, content).length > 0);
    const options = upgradeable(state, content);
    const first = options[0]!;
    const after = applyAction(content, state, { type: 'upgradeCard', deckIndex: first.deckIndex });
    mount(state);
    press('u');
    const chooser = screen.getByLabelText('upgrade a card');
    const rows = within(chooser).getAllByRole('listitem');
    expect(rows[0]!.textContent).toContain(content.cards[first.cardId]!.name);
    expect(rows[0]!.textContent).toContain(`was ${content.cards[first.cardId]!.description}`);
    expect(rows[0]!.textContent).toContain(`now ${content.cards[first.upgradeId]!.description}`);
    fireEvent.click(rows[0]!);
    expect(screen.getByLabelText('the map')).toBeTruthy();
    expect(after.deck).toContain(first.upgradeId);
    // The HUD deck size is unchanged (an upgrade swaps, never adds).
    expect(screen.getByLabelText('run status').textContent).toContain(`deck ${after.deck.length}`);
  });

  it('esc backs out of the upgrade chooser without dispatching', () => {
    const { state } = findPhase('web-a2-rest', 'rest', (s) => upgradeable(s, content).length > 0);
    mount(state);
    press('u');
    expect(screen.getByLabelText('upgrade a card')).toBeTruthy();
    press('Escape');
    expect(screen.getByLabelText('the rest site')).toBeTruthy();
  });
});
