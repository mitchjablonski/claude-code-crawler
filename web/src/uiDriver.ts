/**
 * TEST-ONLY DOM driver: a simple state-aware script that plays the rendered
 * app purely through the UI — it only reads the DOM (aria labels) and only
 * acts via real clicks/keydowns, never touching engine state directly. Shared
 * by the REQ-2 full-run proof and the phase-B persistence wiring tests.
 */
import { fireEvent, screen, within } from '@testing-library/react';
import { expect } from 'vitest';

export type StepPhase =
  | 'title'
  | 'map'
  | 'combat'
  | 'reward'
  | 'shop'
  | 'rest'
  | 'event'
  | 'event-result'
  | 'over';

const press = (key: string) => fireEvent.keyDown(window, { key });

/** Which screen is on screen, from rendered aria-labels only. */
export function visiblePhase(): StepPhase {
  if (screen.queryByLabelText('run over')) return 'over';
  if (screen.queryByLabelText('combat')) return 'combat';
  if (screen.queryByLabelText('reward')) return 'reward';
  if (screen.queryByLabelText('the shop')) return 'shop';
  if (screen.queryByLabelText('the rest site')) return 'rest';
  if (screen.queryByLabelText('event result')) return 'event-result';
  if (screen.queryByLabelText('event')) return 'event';
  if (screen.queryByLabelText('the map')) return 'map';
  return 'title';
}

/** One scripted UI step for the current screen. */
export function step(phase: StepPhase): void {
  switch (phase) {
    case 'title':
      press('n');
      return;
    case 'map':
      // Always descend the first fork (keyboard path).
      press('1');
      return;
    case 'combat': {
      // Mouse path: click the first playable card; resolve targeting by
      // clicking the first targetable enemy; otherwise end the turn.
      if (screen.queryByText('Choose a target:')) {
        const enemies = within(screen.getByRole('list', { name: 'enemies' }))
          .getAllByRole('listitem')
          .filter((b) => b.getAttribute('aria-disabled') === 'false');
        expect(enemies.length).toBeGreaterThan(0);
        fireEvent.click(enemies[0]!);
        return;
      }
      const playable = within(screen.getByRole('list', { name: 'hand' }))
        .queryAllByRole('listitem')
        .filter((b) => b.getAttribute('aria-disabled') === 'false');
      if (playable.length > 0) fireEvent.click(playable[0]!);
      else press('e');
      return;
    }
    case 'reward':
      // Take the first card (grows the deck through the run).
      press('1');
      return;
    case 'shop':
      press('l');
      return;
    case 'rest':
      press('r');
      return;
    case 'event': {
      // Click the first available option (locked ones are aria-disabled).
      const options = within(screen.getByRole('list', { name: 'event options' }))
        .getAllByRole('listitem')
        .filter((b) => b.getAttribute('aria-disabled') === 'false');
      expect(options.length).toBeGreaterThan(0);
      fireEvent.click(options[0]!);
      return;
    }
    case 'event-result':
      press('1');
      return;
    case 'over':
      return;
  }
}

/**
 * Run the script against an ALREADY-RENDERED App until a terminal screen (or
 * the step cap). Returns the deduped phase trace.
 */
export function driveToGameOver(maxSteps = 3000): string {
  const phases: StepPhase[] = [];
  let last: StepPhase | null = null;
  for (let i = 0; i < maxSteps; i++) {
    const phase = visiblePhase();
    if (phase !== last) {
      phases.push(phase);
      last = phase;
    }
    if (phase === 'over') break;
    step(phase);
  }
  return phases.join('>');
}
