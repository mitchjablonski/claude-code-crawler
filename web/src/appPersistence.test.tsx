/**
 * Phase-B shell wiring tests: the App autosaves on the terminal's exact
 * cadence (safe boundaries), resumes a saved run from the Title ("Continue
 * your delve"), hydrates + persists settings, records finished runs with the
 * meta lines on GameOver (NEW BEST / Best), and surfaces the local-only note
 * when saves fell back to localStorage. All against a call-recording fake of
 * the WebSaveStore surface — the store itself is covered in persistence.test.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { isSafeBoundary, type RunState } from '@game/engine/types.js';
import {
  EMPTY_META,
  type MetaSettings,
  type MetaState,
  type RunRecord,
  type SavedRun,
} from '@game/persistence/format.js';
import { App } from './App.js';
import type { WebSaveStore } from './persistence.js';
import { findState } from './testkit.js';
import { driveToGameOver, step, visiblePhase } from './uiDriver.js';

afterEach(cleanup);
const press = (key: string) => fireEvent.keyDown(window, { key });

interface Calls {
  readonly saved: RunState[];
  cleared: number;
  readonly recorded: RunRecord[];
  readonly settings: MetaSettings[];
}

function fakeStore(init?: {
  readonly meta?: MetaState;
  readonly run?: SavedRun | null;
  readonly shared?: boolean;
}): { store: WebSaveStore; calls: Calls } {
  const calls: Calls = { saved: [], cleared: 0, recorded: [], settings: [] };
  const store: WebSaveStore = {
    shared: init?.shared ?? true,
    initialMeta: init?.meta ?? EMPTY_META,
    initialRun: init?.run ?? null,
    saveRun: (s) => {
      calls.saved.push(s);
      return Promise.resolve();
    },
    clearRun: () => {
      calls.cleared += 1;
      return Promise.resolve();
    },
    recordRun: (r) => {
      calls.recorded.push(r);
      return Promise.resolve();
    },
    updateSettings: (s) => {
      calls.settings.push(s);
      return Promise.resolve();
    },
  };
  return { store, calls };
}

describe('autosave cadence', () => {
  it('saves the fresh run at [n] and again at every safe boundary reached', () => {
    const { store, calls } = fakeStore();
    render(<App locationSearch="?seed=web-b-autosave" store={store} now={() => 77} />);
    press('n');
    expect(calls.saved).toHaveLength(1);
    expect(calls.saved[0]?.seed).toBe('web-b-autosave');

    // Walk the run forward through the UI (the shared honest driver: it plays
    // fights for real); each new save must be an engine-defined safe boundary
    // (never mid-combat) — useGame's exact rule.
    for (let i = 0; i < 500 && calls.saved.length < 3; i++) {
      const phase = visiblePhase();
      if (phase === 'over') break;
      step(phase);
    }
    expect(calls.saved.length).toBeGreaterThanOrEqual(3);
    for (const saved of calls.saved) expect(isSafeBoundary(saved)).toBe(true);
    expect(calls.recorded).toHaveLength(0); // nothing finished yet
  });
});

describe('resume (Continue your delve)', () => {
  const midRun = () =>
    findState(
      'web-b-resume',
      (s) => s.phase === 'map' && (s.map.nodes[s.currentNodeId]?.row ?? 0) > 0,
    ).state;

  it('offers [c] on the Title when a saved run exists and restores it', () => {
    const state = midRun();
    const { store } = fakeStore({ run: { state, savedAt: 1 } });
    render(<App store={store} locationSearch="" />);
    expect(screen.getByText('[c] Continue your delve')).toBeTruthy();

    press('c');
    expect(screen.getByLabelText('the map')).toBeTruthy();
    const depth = state.map.nodes[state.currentNodeId]?.row ?? 0;
    expect(screen.getByLabelText('run status').textContent).toContain(`depth ${depth}/`);
    expect(screen.getByLabelText('run status').textContent).toContain(
      `HP ${state.hp}/${state.maxHp}`,
    );
  });

  it('offers no Continue without a save (and [c] does nothing)', () => {
    const { store } = fakeStore();
    render(<App store={store} locationSearch="" />);
    expect(screen.queryByText('[c] Continue your delve')).toBeNull();
    press('c');
    expect(screen.getByText('[n] New delve')).toBeTruthy(); // still the Title
  });
});

describe('settings persistence', () => {
  const savedSettings: MetaState = {
    ...EMPTY_META,
    settings: { difficulty: 'hard', runMode: 'arc', character: 'warlock' },
  };

  it('hydrates class/difficulty/mode from persisted meta (terminal parity)', () => {
    const { store } = fakeStore({ meta: savedSettings });
    render(<App store={store} locationSearch="" />);
    expect(screen.getByText('Hard')).toBeTruthy();
    expect(screen.getByText('Multi-act arc')).toBeTruthy();
    const pressed = screen
      .getAllByRole('button', { pressed: true })
      .find((b) => b.getAttribute('aria-pressed') === 'true');
    expect(pressed?.textContent).toContain('Warlock');
  });

  it('persists every cycle/select exactly like the terminal Title', () => {
    const { store, calls } = fakeStore({ meta: savedSettings });
    render(<App store={store} locationSearch="" />);
    press('d'); // hard -> nightmare
    expect(calls.settings).toContainEqual({ difficulty: 'nightmare' });
    press('m'); // arc -> single
    expect(calls.settings).toContainEqual({ runMode: 'single' });
    fireEvent.click(screen.getByText('Knight'));
    expect(calls.settings).toContainEqual({ character: 'knight' });
  });
});

describe('run-end recording + GameOver meta lines', () => {
  it('records the finished run (outcome/config/score), clears the save, and celebrates NEW BEST', () => {
    const { store, calls } = fakeStore();
    render(<App locationSearch="?seed=web-b-record" store={store} now={() => 99} />);
    driveToGameOver();

    const report = screen.getByLabelText('run over').textContent ?? '';
    expect(calls.recorded).toHaveLength(1);
    const record = calls.recorded[0]!;
    expect(record.seed).toBe('web-b-record');
    expect(record.outcome).toBe(report.includes('THE SCOPE CREEP IS SLAIN') ? 'victory' : 'defeat');
    expect(record).toMatchObject({ difficulty: 'normal', mode: 'single', character: 'knight' });
    expect(typeof record.score).toBe('number');
    expect(record.endedAt).toBe(new Date(99).toISOString());
    expect(calls.cleared).toBeGreaterThanOrEqual(1);

    // First recorded run for this (character, mode) => personal best fanfare.
    expect(report).toContain(`NEW BEST! ${record.score}`);

    // The run save is gone: back on the Title there is nothing to continue.
    press('t');
    expect(screen.queryByText('[c] Continue your delve')).toBeNull();
  });

  it('shows Score · Best when a prior run holds the record', () => {
    const meta: MetaState = {
      ...EMPTY_META,
      runs: [
        {
          seed: 'earlier',
          outcome: 'victory',
          endedAt: 'then',
          character: 'knight',
          mode: 'single',
          score: 999_999,
        },
      ],
    };
    const { store } = fakeStore({ meta });
    render(<App locationSearch="?seed=web-b-best" store={store} />);
    driveToGameOver();
    const report = screen.getByLabelText('run over').textContent ?? '';
    expect(report).toContain('Best 999999');
    expect(report).not.toContain('NEW BEST!');
  });

  it('without a store the report stays the plain A2 score line', () => {
    render(<App locationSearch="?seed=web-b-nostore" />);
    driveToGameOver();
    const report = screen.getByLabelText('run over').textContent ?? '';
    expect(report).toContain('Score ');
    expect(report).not.toContain('NEW BEST!');
    expect(report).not.toContain('Best ');
  });
});

describe('local-only fallback note', () => {
  it('says so on the Title when saves are localStorage-only', () => {
    const { store } = fakeStore({ shared: false });
    render(<App store={store} locationSearch="" />);
    expect(screen.getByText(/local-only saves/)).toBeTruthy();
  });

  it('stays quiet when the save bridge is connected (or persistence is off)', () => {
    const { store } = fakeStore({ shared: true });
    render(<App store={store} locationSearch="" />);
    expect(screen.queryByText(/local-only saves/)).toBeNull();
    cleanup();
    render(<App locationSearch="" />);
    expect(screen.queryByText(/local-only saves/)).toBeNull();
  });
});
