import { describe, expect, it, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { RewardScreen } from './RewardScreen.js';
import { createRun } from '../../engine/run.js';
import { DEFAULT_RUN_CONFIG, content } from '../../engine/content/index.js';
import type { GameAction, RunState } from '../../engine/types.js';

const noop = () => undefined;

/** A RunState parked on a victory reward with the given loot. */
function onReward(reward: RunState['reward']): RunState {
  const base = createRun(content, 'reward-test', DEFAULT_RUN_CONFIG);
  return { ...base, phase: 'reward', reward };
}

describe('RewardScreen', () => {
  it('shows the gold in the title, any auto-granted loot, and the card prompt', () => {
    const potionId = Object.keys(content.potions)[0]!;
    const relicId = Object.keys(content.relics)[0]!;
    const { lastFrame } = render(
      <RewardScreen
        state={onReward({
          gold: 25,
          cards: ['rusty-shortsword', 'battered-buckler'],
          relicId,
          potionId,
        })}
        content={content}
        dispatch={noop}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Victory! +25g');
    // Auto-granted loot lines (grouped above the card choice).
    expect(frame).toContain('Relic claimed:');
    expect(frame).toContain('Found a potion:');
    expect(frame).toContain(content.relics[relicId]!.name);
    expect(frame).toContain(content.potions[potionId]!.name);
    // The active choice and its cards.
    expect(frame).toContain('Take a card for your deck:');
    expect(frame).toContain('Rusty Shortsword');
    expect(frame).toContain('Battered Buckler');
    expect(frame).toContain('[1]');
    expect(frame).toContain('[2]');
    // Footer key hints.
    expect(frame).toContain('[s] skip');
    // Loot group is separated from the card prompt by a blank row (uniform
    // section spacing, matching the shop). The potion line is immediately
    // followed by a blank line, then the prompt.
    const lines = frame.split('\n').map((l) => l.trim());
    const promptIdx = lines.findIndex((l) => l.startsWith('Take a card'));
    expect(promptIdx).toBeGreaterThan(0);
    expect(lines[promptIdx - 1]).toBe('');
  });

  it('omits the loot group (and its spacing) when there is no relic or potion', () => {
    const { lastFrame } = render(
      <RewardScreen
        state={onReward({ gold: 10, cards: ['rusty-shortsword'] })}
        content={content}
        dispatch={noop}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Take a card for your deck:');
    expect(frame).not.toContain('Relic claimed:');
    expect(frame).not.toContain('Found a potion:');
  });

  it('pressing a number dispatches pickRewardCard for that index', async () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    const { stdin } = render(
      <RewardScreen
        state={onReward({ gold: 0, cards: ['rusty-shortsword', 'battered-buckler'] })}
        content={content}
        dispatch={dispatch}
      />,
    );
    await new Promise((r) => setTimeout(r, 25));
    stdin.write('2');
    await new Promise((r) => setTimeout(r, 25));
    expect(dispatch).toHaveBeenCalledWith({ type: 'pickRewardCard', index: 1 });
  });

  it('pressing s skips the reward', async () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    const { stdin } = render(
      <RewardScreen
        state={onReward({ gold: 0, cards: ['rusty-shortsword'] })}
        content={content}
        dispatch={dispatch}
      />,
    );
    await new Promise((r) => setTimeout(r, 25));
    stdin.write('s');
    await new Promise((r) => setTimeout(r, 25));
    expect(dispatch).toHaveBeenCalledWith({ type: 'skipReward' });
  });
});
