/**
 * REQ-2 proof: a FULL seeded run is playable in the browser, purely through
 * the UI. The script starts on the Title, presses [n], then loops a simple
 * state-aware driver that only reads the RENDERED DOM and only acts via real
 * clicks/keydowns (never touching engine state directly): clicks playable hand
 * cards + targets in combat, ends turns, takes reward cards, leaves shops,
 * rests, chooses event options — until the run reaches a terminal screen
 * (Run Complete / Run Ended). Asserts the engine actually progressed and that
 * the SAME seed replays the SAME script to the SAME outcome (determinism).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from './App.js';

afterEach(cleanup);
const press = (key: string) => fireEvent.keyDown(window, { key });

type StepPhase =
  | 'title'
  | 'map'
  | 'combat'
  | 'reward'
  | 'shop'
  | 'rest'
  | 'event'
  | 'event-result'
  | 'over';

/** Which screen is on screen, from rendered aria-labels only. */
function visiblePhase(): StepPhase {
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
function step(phase: StepPhase): void {
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

/** Run the whole script; returns the phase trace + the final report text. */
function playFullRun(seed: string): { trace: string; report: string } {
  render(<App locationSearch={`?seed=${seed}`} />);
  const phases: StepPhase[] = [];
  let last: StepPhase | null = null;
  for (let i = 0; i < 3000; i++) {
    const phase = visiblePhase();
    if (phase !== last) {
      phases.push(phase);
      last = phase;
    }
    if (phase === 'over') break;
    step(phase);
  }
  const report = screen.getByLabelText('run over').textContent ?? '';
  cleanup();
  return { trace: phases.join('>'), report };
}

describe('full run (REQ-2)', () => {
  it('plays a seeded run from Title to a terminal screen through the UI', () => {
    const { trace, report } = playFullRun('web-a2-fullrun');
    // The run actually went somewhere: title -> map -> at least one combat.
    expect(trace.startsWith('title>map')).toBe(true);
    expect(trace).toContain('combat');
    // …and ended on a real report with non-zero progress.
    expect(report).toMatch(/THE SCOPE CREEP IS SLAIN|YOU DIED/);
    expect(report).toMatch(/Turns [1-9]/);
    expect(report).toContain('Seed web-a2-fullrun');
  });

  it('is deterministic: the same seed replays the same script to the same end', () => {
    const first = playFullRun('web-a2-fullrun');
    const second = playFullRun('web-a2-fullrun');
    expect(second.trace).toBe(first.trace);
    expect(second.report).toBe(first.report);
  });
});
