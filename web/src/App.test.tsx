/**
 * Shell tests: Title + Map driven end-to-end against the REAL shared engine
 * (no mocks) — key and click paths both dispatch through the same reducer
 * surface the terminal uses.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { applyAction, createRun } from '@game/engine/run.js';
import { content, CHARACTERS, CHARACTER_IDS } from '@game/engine/content/index.js';
import type { MapNode, RunState } from '@game/engine/types.js';
import { App } from './App.js';
import { runConfigFor } from './game.js';
import { nodeLabel } from './screens/MapScreen.js';

const SEED = 'web-a1-smoke';
const SEARCH = `?seed=${SEED}`;

afterEach(cleanup);

const press = (key: string) => fireEvent.keyDown(window, { key });

/** The engine's own view of the run this seed produces (Knight/normal/single). */
function engineRun(): RunState {
  return createRun(content, SEED, runConfigFor('knight', 'normal', 'single'));
}

function firstChoices(state: RunState): MapNode[] {
  const node = state.map.nodes[state.currentNodeId];
  return (node?.next ?? [])
    .map((id) => state.map.nodes[id])
    .filter((n): n is MapNode => n !== undefined);
}

describe('TitleScreen', () => {
  it('renders all 4 classes with names and taglines', () => {
    render(<App locationSearch={SEARCH} />);
    expect(CHARACTER_IDS).toHaveLength(4);
    for (const id of CHARACTER_IDS) {
      const cls = CHARACTERS[id]!;
      expect(screen.getByText(cls.name)).toBeTruthy();
      expect(screen.getByText(new RegExp(cls.description.slice(0, 20)))).toBeTruthy();
    }
  });

  it('cycles the class with [k] and selects a class by click', () => {
    render(<App locationSearch={SEARCH} />);
    const pressedName = () =>
      within(
        screen
          .getAllByRole('button', { pressed: true })
          .find((b) => b.getAttribute('aria-pressed') === 'true') as HTMLElement,
      );
    expect(pressedName().getByText('Knight')).toBeTruthy();
    press('k');
    expect(pressedName().getByText('Apothecary')).toBeTruthy();
    // Click selects directly (not just cycles).
    fireEvent.click(screen.getByText('Warlock'));
    expect(pressedName().getByText('Warlock')).toBeTruthy();
  });

  it('cycles difficulty with [d] and by click', () => {
    render(<App locationSearch={SEARCH} />);
    expect(screen.getByText('Normal')).toBeTruthy();
    press('d');
    expect(screen.getByText('Hard')).toBeTruthy();
    fireEvent.click(screen.getByText('Hard'));
    expect(screen.getByText('Nightmare')).toBeTruthy();
  });

  it('cycles run mode with [m] and by click', () => {
    render(<App locationSearch={SEARCH} />);
    expect(screen.getByText('Single session')).toBeTruthy();
    press('m');
    expect(screen.getByText('Multi-act arc')).toBeTruthy();
    fireEvent.click(screen.getByText('Multi-act arc'));
    expect(screen.getByText('Single session')).toBeTruthy();
  });

  it('starts a new run with [n] (key) — the map appears', () => {
    render(<App locationSearch={SEARCH} />);
    press('n');
    expect(screen.getByText('The Map', { exact: false })).toBeTruthy();
  });

  it('starts a new run by clicking "New delve"', () => {
    render(<App locationSearch={SEARCH} />);
    fireEvent.click(screen.getByText('[n] New delve'));
    expect(screen.getByText('The Map', { exact: false })).toBeTruthy();
  });
});

describe('MapScreen', () => {
  function startRun() {
    const utils = render(<App locationSearch={SEARCH} />);
    press('n');
    return utils;
  }

  it("renders exactly the engine's node choices for the seed", () => {
    startRun();
    const expected = firstChoices(engineRun());
    expect(expected.length).toBeGreaterThan(0);
    const buttons = within(screen.getByRole('list', { name: 'paths' })).getAllByRole('listitem');
    expect(buttons).toHaveLength(expected.length);
    expected.forEach((node, i) => {
      expect(buttons[i]!.textContent).toContain(`[${i + 1}]`);
      expect(buttons[i]!.textContent).toContain(nodeLabel(node, content));
    });
  });

  it('shows the HUD strip with hp/gold/depth from the run', () => {
    startRun();
    const run = engineRun();
    const hud = screen.getByLabelText('run status');
    expect(hud.textContent).toContain(`HP ${run.hp}/${run.maxHp}`);
    expect(hud.textContent).toContain(`${run.gold}g`);
    expect(hud.textContent).toContain('depth 0/');
  });

  it('clicking a node advances the run (engine state changes)', () => {
    startRun();
    const before = engineRun();
    const target = firstChoices(before)[0]!;
    const after = applyAction(content, before, { type: 'chooseNode', nodeId: target.id });
    fireEvent.click(
      within(screen.getByRole('list', { name: 'paths' })).getAllByRole('listitem')[0]!,
    );
    if (after.phase === 'map') {
      expect(screen.getByText(`Depth ${target.row}/`, { exact: false })).toBeTruthy();
    } else {
      // A2: the destination phase renders its REAL screen (never a stub).
      const label: Record<string, string> = {
        combat: 'combat',
        event: 'event',
        shop: 'the shop',
        rest: 'the rest site',
        reward: 'reward',
      };
      expect(screen.getByLabelText(label[after.phase] ?? after.phase)).toBeTruthy();
    }
    // Depth in the HUD moved off the start row either way.
    expect(screen.getByLabelText('run status').textContent).toContain(`depth ${target.row}/`);
  });

  it('pressing a number key advances the run the same way', () => {
    startRun();
    const before = engineRun();
    const target = firstChoices(before)[0]!;
    press('1');
    expect(screen.getByLabelText('run status').textContent).toContain(`depth ${target.row}/`);
  });

  it('is deterministic: the same ?seed renders the same map choices', () => {
    const texts = () =>
      within(screen.getByRole('list', { name: 'paths' }))
        .getAllByRole('listitem')
        .map((b) => b.textContent);
    startRun();
    const first = texts();
    cleanup();
    startRun();
    expect(texts()).toEqual(first);
    expect(first.length).toBeGreaterThan(0);
  });

  it('entering a combat node renders the REAL combat screen (A2)', () => {
    // Drive the REAL run to its first combat entry via the engine, then mirror
    // the same choices through the UI.
    let probe = engineRun();
    const path: string[] = [];
    while (probe.phase === 'map' && path.length < 10) {
      const choices = firstChoices(probe);
      const combat = choices.find((c) => c.kind === 'combat' || c.kind === 'elite');
      const pick = combat ?? choices[0]!;
      path.push(pick.id);
      probe = applyAction(content, probe, { type: 'chooseNode', nodeId: pick.id });
    }
    expect(probe.phase).toBe('combat');

    startRun();
    let expected = engineRun();
    for (const nodeId of path) {
      const choices = firstChoices(expected);
      const index = choices.findIndex((c) => c.id === nodeId);
      fireEvent.click(
        within(screen.getByRole('list', { name: 'paths' })).getAllByRole('listitem')[index]!,
      );
      expected = applyAction(content, expected, { type: 'chooseNode', nodeId });
    }
    // The real combat screen: the engine's actual enemies for this seeded
    // fight, each telegraphing a next move, plus the player's dealt hand.
    const stage = screen.getByRole('list', { name: 'enemies' });
    for (const enemy of expected.combat!.enemies) {
      expect(stage.textContent).toContain(enemy.name);
      expect(stage.textContent).toContain(`${enemy.hp}/${enemy.maxHp}`);
    }
    expect(stage.textContent).toContain('next:');
    const hand = screen.getByRole('list', { name: 'hand' });
    expect(within(hand).getAllByRole('listitem')).toHaveLength(expected.combat!.hand.length);
  });

  it('opens and closes the deck overlay with [v]', () => {
    startRun();
    press('v');
    expect(screen.getByText(/Your deck \(9 cards\)/)).toBeTruthy();
    // Knight starter deck contents, grouped with counts.
    expect(screen.getByText('Rusty Shortsword')).toBeTruthy();
    expect(screen.getByText('x4')).toBeTruthy();
    press('v');
    expect(screen.queryByText(/Your deck/)).toBeNull();
    expect(screen.getByText('The Map', { exact: false })).toBeTruthy();
  });
});
