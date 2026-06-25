import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { GameOverScreen } from './GameOverScreen.js';
import { createRun } from '../../engine/run.js';
import { DEFAULT_RUN_CONFIG, content } from '../../engine/content/index.js';
import type { RunState } from '../../engine/types.js';

/** A finished-run RunState in the given phase, with optional held relics. */
function finished(phase: 'victory' | 'defeat', relics: readonly string[] = []): RunState {
  const base = createRun(content, 'over-test', DEFAULT_RUN_CONFIG);
  return {
    ...base,
    phase,
    hp: 24,
    maxHp: 80,
    gold: 137,
    relics,
    stats: { turns: 18, damageDealt: 240, damageTaken: 96, enemiesSlain: 11 },
  };
}

const noop = () => undefined;

describe('GameOverScreen run summary', () => {
  it('victory shows depth, relics, deck, gold, hp, and the win anchor', () => {
    const state = finished('victory');
    const bossRow = state.map.nodes[state.map.bossId]?.row ?? 0;
    const { lastFrame } = render(
      <GameOverScreen state={state} relicNames={['Lucky Pocket Dice']} onNew={noop} onTitle={noop} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('THE SCOPE CREEP IS SLAIN');
    expect(frame).toContain(`Depth reached`);
    expect(frame).toContain(`/${bossRow}`);
    expect(frame).toContain('Final HP');
    expect(frame).toContain('24/80');
    expect(frame).toContain(`${state.deck.length} cards`);
    expect(frame).toContain('137g');
    expect(frame).toContain('Relics');
    expect(frame).toContain('Lucky Pocket Dice');
    expect(frame).toContain('over-test'); // seed preserved (shareable id)
    expect(frame).toContain('[n] new delve');
  });

  it('defeat shows the same summary stats and the death anchor', () => {
    const state = finished('defeat', ['pocket-dice']);
    const { lastFrame } = render(
      <GameOverScreen state={state} relicNames={['Pocket Dice']} onNew={noop} onTitle={noop} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('YOU DIED');
    expect(frame).toContain('Depth reached');
    expect(frame).toContain('Final HP');
    expect(frame).toContain('24/80');
    expect(frame).toContain('137g');
    expect(frame).toContain('Pocket Dice');
    expect(frame).toContain('[t] title');
    expect(frame).toContain('[q] quit');
  });

  it('surfaces the run stats (turns/dealt/taken/slain) in the report', () => {
    const { lastFrame } = render(
      <GameOverScreen state={finished('victory')} relicNames={[]} onNew={noop} onTitle={noop} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Turns');
    expect(frame).toContain('18');
    expect(frame).toContain('Dealt');
    expect(frame).toContain('240');
    expect(frame).toContain('Taken');
    expect(frame).toContain('96');
    expect(frame).toContain('Slain');
    expect(frame).toContain('11');
  });

  it('shows "none" when no relics are held', () => {
    const { lastFrame } = render(
      <GameOverScreen state={finished('defeat')} relicNames={[]} onNew={noop} onTitle={noop} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Relics');
    expect(frame).toContain('none');
  });

  it('shows the daily-score line for daily runs', () => {
    const { lastFrame } = render(
      <GameOverScreen
        state={finished('victory')}
        relicNames={[]}
        onNew={noop}
        onTitle={noop}
        dailyDate="2026-06-24"
        dailyScore={4242}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Daily 2026-06-24 score: 4242');
    // non-daily summary stats still present alongside the daily line
    expect(frame).toContain('Depth reached');
  });

  it('omits the daily line for non-daily runs but keeps the summary', () => {
    const { lastFrame } = render(
      <GameOverScreen state={finished('victory')} relicNames={[]} onNew={noop} onTitle={noop} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).not.toContain('Daily');
    expect(frame).toContain('Depth reached');
  });
});
