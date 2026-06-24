import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { StatusBar } from './StatusBar.js';
import { createRun } from '../../engine/run.js';
import { DEFAULT_RUN_CONFIG, content } from '../../engine/content/index.js';
import type { CombatState, RunState } from '../../engine/types.js';

/** A RunState in the combat phase with the given player statuses. */
function combatState(playerStatuses: CombatState['playerStatuses']): RunState {
  const base = createRun(content, 'statusbar-test', DEFAULT_RUN_CONFIG);
  const combat: CombatState = {
    enemies: [],
    hand: [],
    drawPile: [],
    discardPile: [],
    energy: 3,
    maxEnergy: 3,
    playerHp: base.hp,
    playerMaxHp: base.maxHp,
    playerBlock: 0,
    playerStatuses,
    turn: 1,
  };
  return { ...base, phase: 'combat', combat };
}

describe('StatusBar', () => {
  it('keeps the HUD + narration intact (no player statuses)', () => {
    const base = createRun(content, 'statusbar-test', DEFAULT_RUN_CONFIG);
    const { lastFrame } = render(
      <StatusBar state={base} linked={false} narration="found a coin purse" />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain(`HP ${base.hp}/${base.maxHp}`);
    expect(frame).toContain(`${base.gold}g`);
    expect(frame).toContain('coin purse');
    expect(frame).toContain('dungeon: dormant');
  });

  it('surfaces the player combat statuses with the canonical glyph', () => {
    // Same canonical glyph (icon + identity color + format) as enemy tags and
    // intent chips: `<ICON> <N>` with a space.
    const { lastFrame } = render(
      <StatusBar
        state={combatState({ strength: 2, vulnerable: 1 })}
        linked
        narration={null}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('STR 2');
    expect(frame).toContain('VUL 1');
    // HUD combat fields stay anchored.
    expect(frame).toContain('BLK 0');
    expect(frame).toContain('EN 3/3');
  });

  it('shows no status brackets in combat when the player has none', () => {
    const { lastFrame } = render(
      <StatusBar state={combatState({})} linked narration={null} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).not.toContain('STR');
    expect(frame).not.toContain('VUL');
  });
});
