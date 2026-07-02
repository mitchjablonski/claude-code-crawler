/**
 * Game-over screen tests: run report contents (score/class/stats/seed) for
 * both outcomes, and the [n]/[t] exits.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { runScore } from '@game/progression/daily.js';
import type { RunState } from '@game/engine/types.js';
import { content } from '@game/engine/content/index.js';
import { App } from '../App.js';
import { GameOverScreen } from './GameOverScreen.js';
import { findState, newRun } from '../testkit.js';

afterEach(cleanup);
const press = (key: string) => fireEvent.keyDown(window, { key });
const mount = (state: RunState) => render(<App locationSearch="?seed=web-a2-go" initialState={state} />);

/** A real played-to-the-end run (win or lose — the policy fights honestly). */
function finishedRun(): RunState {
  return findState('web-a2-over', (s) => s.phase === 'victory' || s.phase === 'defeat', {
    seeds: 10,
  }).state;
}

describe('GameOverScreen', () => {
  it('reports the run: outcome banner, score, class, depth, stats, seed', () => {
    const state = finishedRun();
    mount(state);
    const panel = screen.getByLabelText('run over');
    expect(panel.textContent).toContain(
      state.phase === 'victory' ? 'THE SCOPE CREEP IS SLAIN' : 'YOU DIED',
    );
    expect(panel.textContent).toContain(`Score ${runScore(state)}`);
    expect(panel.textContent).toContain('Class Knight');
    expect(panel.textContent).toContain(`Final HP ${state.hp}/${state.maxHp}`);
    expect(panel.textContent).toContain(`Deck ${state.deck.length} cards`);
    expect(panel.textContent).toContain(`Turns ${state.stats.turns}`);
    expect(panel.textContent).toContain(`Slain ${state.stats.enemiesSlain}`);
    expect(panel.textContent).toContain(`Seed ${state.seed}`);
    // The HUD strip is hidden once the run is over (mirrors the terminal).
    expect(screen.queryByLabelText('run status')).toBeNull();
  });

  it('renders the victory banner for a phase=victory state', () => {
    // Presentation check on a real state flipped to the win phase.
    const won: RunState = { ...newRun('web-a2-win'), phase: 'victory' };
    mount(won);
    expect(screen.getByText('Run Complete')).toBeTruthy();
    expect(screen.getByText('THE SCOPE CREEP IS SLAIN')).toBeTruthy();
  });

  it('[t] returns to the title', () => {
    mount(finishedRun());
    press('t');
    expect(screen.getByText('[n] New delve')).toBeTruthy();
  });

  it('[n] starts a new delve straight from the report', () => {
    mount(finishedRun());
    press('n');
    expect(screen.getByLabelText('the map')).toBeTruthy();
  });

  it('clicking the buttons works too', () => {
    mount(finishedRun());
    fireEvent.click(screen.getByText(/Back to title/));
    expect(screen.getByText('[n] New delve')).toBeTruthy();
  });
});

describe('GameOverScreen meta lines (phase B, terminal mirror)', () => {
  const state = finishedRun();
  const score = runScore(state);
  const mountWith = (props: {
    priorBest?: number | null;
    unlockedNames?: readonly string[];
  }) =>
    render(
      <GameOverScreen
        state={state}
        content={content}
        characterName="Knight"
        onNew={() => {}}
        onTitle={() => {}}
        {...props}
      />,
    );

  it('celebrates NEW BEST when there is no prior best (first such run)', () => {
    mountWith({ priorBest: null });
    expect(screen.getByText(`NEW BEST! ${score}`)).toBeTruthy();
    expect(screen.queryByText(/prev /)).toBeNull();
  });

  it('shows the beaten previous best next to a NEW BEST', () => {
    mountWith({ priorBest: score - 1 });
    expect(screen.getByText(`NEW BEST! ${score}`)).toBeTruthy();
    expect(screen.getByText(`(prev ${score - 1})`)).toBeTruthy();
  });

  it('shows Score · Best when the personal best stands', () => {
    mountWith({ priorBest: score + 100 });
    expect(screen.getByText(`Score ${score}`)).toBeTruthy();
    expect(screen.getByText(`· Best ${score + 100}`)).toBeTruthy();
    expect(screen.queryByText(/NEW BEST!/)).toBeNull();
  });

  it('announces unlocks earned by this run', () => {
    mountWith({ priorBest: null, unlockedNames: ['Heroic Second Wind', "Crawler's Resolve"] });
    expect(
      screen.getByText("NEW UNLOCKED: Heroic Second Wind, Crawler's Resolve"),
    ).toBeTruthy();
  });

  it('renders no unlock line by default', () => {
    mountWith({ priorBest: null });
    expect(screen.queryByText(/NEW UNLOCKED/)).toBeNull();
  });
});
