/**
 * REQ-2 proof: a FULL seeded run is playable in the browser, purely through
 * the UI. The script starts on the Title, presses [n], then loops the shared
 * DOM driver (`uiDriver.ts`) that only reads the RENDERED DOM and only acts
 * via real clicks/keydowns (never touching engine state directly) — until the
 * run reaches a terminal screen (Run Complete / Run Ended). Asserts the engine
 * actually progressed and that the SAME seed replays the SAME script to the
 * SAME outcome (determinism).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { App } from './App.js';
import { driveToGameOver } from './uiDriver.js';

afterEach(cleanup);

/** Run the whole script; returns the phase trace + the final report text. */
function playFullRun(seed: string): { trace: string; report: string } {
  render(<App locationSearch={`?seed=${seed}`} />);
  const trace = driveToGameOver();
  const report = screen.getByLabelText('run over').textContent ?? '';
  cleanup();
  return { trace, report };
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
