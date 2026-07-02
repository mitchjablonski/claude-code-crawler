/**
 * Combat screen tests: the full shell mounted mid-run on REAL engine states
 * (App's `initialState` seam), driven by the SAME keys/clicks the terminal
 * documents. Every expectation is mirrored against the engine's own
 * applyAction result — no mocked reducers anywhere.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { applyAction } from '@game/engine/run.js';
import { content } from '@game/engine/content/index.js';
import type { RunState } from '@game/engine/types.js';
import { App } from '../App.js';
import { findPhase } from '../testkit.js';

afterEach(cleanup);
const press = (key: string) => fireEvent.keyDown(window, { key });
const living = (s: RunState) => s.combat!.enemies.filter((e) => e.hp > 0);
const mount = (state: RunState) => render(<App locationSearch="" initialState={state} />);

/** Engine-mirror of the screen's play-card rule for hand index 0. */
function playFirst(state: RunState): RunState {
  const card = content.cards[state.combat!.hand[0]!]!;
  const target = card.target === 'enemy' ? { targetIndex: state.combat!.enemies.findIndex((e) => e.hp > 0) } : {};
  return applyAction(content, state, { type: 'playCard', handIndex: 0, ...target });
}

describe('CombatScreen', () => {
  it('renders enemies with hp, hp bar, and the telegraphed intent', () => {
    const { state } = findPhase('web-a2-combat', 'combat');
    mount(state);
    const stage = screen.getByRole('list', { name: 'enemies' });
    for (const enemy of state.combat!.enemies) {
      expect(stage.textContent).toContain(enemy.name);
      if (enemy.hp > 0) expect(stage.textContent).toContain(`${enemy.hp}/${enemy.maxHp}`);
    }
    expect(stage.textContent).toContain('next:');
    // The combat HUD carries energy, block, and the pile clock.
    const hud = screen.getByLabelText('run status');
    expect(hud.textContent).toContain(`EN ${state.combat!.energy}/${state.combat!.maxEnergy}`);
    expect(hud.textContent).toContain(`BLK ${state.combat!.playerBlock}`);
    expect(hud.textContent).toContain(`draw ${state.combat!.drawPile.length}`);
    expect(hud.textContent).toContain(`turn ${state.combat!.turn}`);
  });

  it('plays a card with its number key (engine-mirrored energy/hand)', () => {
    const { state } = findPhase('web-a2-combat', 'combat', (s) => living(s).length === 1);
    const after = playFirst(state);
    mount(state);
    press('1');
    const hud = screen.getByLabelText('run status');
    expect(hud.textContent).toContain(`EN ${after.combat!.energy}/${after.combat!.maxEnergy}`);
    expect(within(screen.getByRole('list', { name: 'hand' })).getAllByRole('listitem')).toHaveLength(
      after.combat!.hand.length,
    );
  });

  it('shows a damage beat on the enemy the last action hit', () => {
    const { state } = findPhase(
      'web-a2-beat',
      'combat',
      (s) =>
        living(s).length === 1 &&
        (() => {
          // First card is a damage card that actually removes HP.
          const after = playFirst(s);
          const i = s.combat!.enemies.findIndex((e) => e.hp > 0);
          return (after.combat?.enemies[i]?.hp ?? 0) < s.combat!.enemies[i]!.hp;
        })(),
    );
    const after = playFirst(state);
    const i = state.combat!.enemies.findIndex((e) => e.hp > 0);
    const damage = state.combat!.enemies[i]!.hp - after.combat!.enemies[i]!.hp;
    mount(state);
    press('1');
    const stage = screen.getByRole('list', { name: 'enemies' });
    expect(stage.textContent).toContain(`-${damage}`);
  });

  it('targets with click: card -> Choose a target -> enemy (multi-enemy)', () => {
    const targetableCard = (s: RunState) =>
      s.combat!.hand.findIndex((id) => {
        const c = content.cards[id];
        return c !== undefined && c.target === 'enemy' && c.cost <= s.combat!.energy;
      });
    const { state } = findPhase(
      'web-a2-target',
      'combat',
      (s) => living(s).length >= 2 && targetableCard(s) >= 0,
      { seeds: 80 },
    );
    const handIndex = targetableCard(state);
    const targetIndex = state.combat!.enemies.findIndex((e) => e.hp > 0);
    const after = applyAction(content, state, { type: 'playCard', handIndex, targetIndex });
    mount(state);
    // Click the card: multi-enemy target card enters target-select.
    fireEvent.click(within(screen.getByRole('list', { name: 'hand' })).getAllByRole('listitem')[handIndex]!);
    expect(screen.getByText('Choose a target:')).toBeTruthy();
    // Living enemies are now targetable (aria-disabled=false + [N] markers).
    const stage = screen.getByRole('list', { name: 'enemies' });
    expect(stage.textContent).toContain(`[${targetIndex + 1}]`);
    // Click the enemy: the pending card resolves onto it.
    fireEvent.click(within(stage).getAllByRole('listitem')[targetIndex]!);
    expect(screen.queryByText('Choose a target:')).toBeNull();
    expect(screen.getByLabelText('run status').textContent).toContain(
      `EN ${after.combat!.energy}/${after.combat!.maxEnergy}`,
    );
  });

  it('esc cancels target-select without dispatching', () => {
    const targetableCard = (s: RunState) =>
      s.combat!.hand.findIndex((id) => {
        const c = content.cards[id];
        return c !== undefined && c.target === 'enemy' && c.cost <= s.combat!.energy;
      });
    const { state } = findPhase(
      'web-a2-target',
      'combat',
      (s) => living(s).length >= 2 && targetableCard(s) >= 0,
      { seeds: 80 },
    );
    mount(state);
    press(`${targetableCard(state) + 1}`);
    expect(screen.getByText('Choose a target:')).toBeTruthy();
    press('Escape');
    expect(screen.queryByText('Choose a target:')).toBeNull();
    // Nothing dispatched: energy untouched.
    expect(screen.getByLabelText('run status').textContent).toContain(
      `EN ${state.combat!.energy}/${state.combat!.maxEnergy}`,
    );
  });

  it('ends the turn with [e] (engine-mirrored turn counter)', () => {
    const { state } = findPhase(
      'web-a2-endturn',
      'combat',
      (s) => applyAction(content, s, { type: 'endTurn' }).phase === 'combat',
    );
    const after = applyAction(content, state, { type: 'endTurn' });
    mount(state);
    press('e');
    expect(screen.getByLabelText('run status').textContent).toContain(`turn ${after.combat!.turn}`);
  });

  it('dims unaffordable cards (aria-disabled) and counts them in the footer', () => {
    // Hand-tune affordability presentation-side: same engine state, zero energy.
    const { state } = findPhase(
      'web-a2-combat',
      'combat',
      (s) => s.combat!.hand.every((id) => (content.cards[id]?.cost ?? 0) > 0),
    );
    const broke: RunState = { ...state, combat: { ...state.combat!, energy: 0 } };
    mount(broke);
    const hand = within(screen.getByRole('list', { name: 'hand' })).getAllByRole('listitem');
    for (const row of hand) expect(row.getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByText(new RegExp(`${hand.length} unplayable`))).toBeTruthy();
    // Pressing a card key is a guarded no-op.
    press('1');
    expect(screen.getByLabelText('run status').textContent).toContain('EN 0/');
  });

  it('drinks a potion with its letter key (satchel shared keys)', () => {
    const potionId = Object.entries(content.potions).find(([, p]) => p.target !== 'enemy')?.[0];
    expect(potionId).toBeDefined();
    const { state } = findPhase('web-a2-potion', 'combat', (s) => s.potions.length > 0, {
      extra: { startingPotions: [potionId!] },
    });
    const after = applyAction(content, state, { type: 'usePotion', potionIndex: 0 });
    mount(state);
    expect(screen.getByLabelText('satchel').textContent).toContain(
      content.potions[potionId!]!.name,
    );
    press('a');
    expect(screen.getByLabelText('run status').textContent).toContain(
      `pots ${after.potions.length}/${after.maxPotions}`,
    );
    expect(screen.queryByLabelText('satchel')).toBeNull();
  });

  it('shows the live "now N" gradient on scaleMissingHp cards (Overclocker)', () => {
    const gradientInHand = (s: RunState) =>
      s.combat!.hand.some((id) =>
        content.cards[id]?.effects.some(
          (e) => (e.kind === 'damage' || e.kind === 'block') && e.scaleMissingHp !== undefined,
        ),
      );
    const { state } = findPhase('web-a2-heat', 'combat', gradientInHand, {
      character: 'overclocker',
      seeds: 60,
    });
    mount(state);
    expect(
      within(screen.getByRole('list', { name: 'hand' })).getAllByText(/now \d+ (dmg|blk)/).length,
    ).toBeGreaterThan(0);
  });

  it('opens the read-only deck overlay with [v], grouped by pile', () => {
    const { state } = findPhase('web-a2-combat', 'combat');
    mount(state);
    press('v');
    const c = state.combat!;
    expect(
      screen.getByText(
        `Your deck: draw ${c.drawPile.length} | hand ${c.hand.length} | discard ${c.discardPile.length}`,
      ),
    ).toBeTruthy();
    press('Escape');
    expect(screen.queryByText(/Your deck:/)).toBeNull();
    expect(screen.getByLabelText('combat')).toBeTruthy();
  });
});
