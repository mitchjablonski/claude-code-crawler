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
    dealt: 0,
    taken: 0,
    slain: 0,
  };
  return { ...base, phase: 'combat', combat };
}

describe('StatusBar', () => {
  it('keeps the HUD + narration intact (no player statuses)', () => {
    const base = createRun(content, 'statusbar-test', DEFAULT_RUN_CONFIG);
    const { lastFrame } = render(
      <StatusBar state={base} linked={false} narration="found a coin purse" relics={[]} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain(`HP ${base.hp}/${base.maxHp}`);
    expect(frame).toContain(`${base.gold}g`);
    expect(frame).toContain('coin purse');
    expect(frame).toContain('dungeon: dormant');
  });

  it('renders the dungeon-link text in full (not clipped) on its own row', () => {
    // Issue 1 regression: narration + dungeon-link no longer share a row, so the
    // core-premise dungeon status is always fully visible even with long narration.
    const base = createRun(content, 'statusbar-test', DEFAULT_RUN_CONFIG);
    const longNarration =
      'a very long bit of player narration that would have crowded out the dungeon status before the fix';
    const { lastFrame } = render(
      <StatusBar state={base} linked={false} narration={longNarration} relics={[]} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('dungeon: dormant (ccc init)');
    expect(frame).toContain('player narration');
  });

  it('shows a persistent relics line with held relic names', () => {
    const base = createRun(content, 'statusbar-test', DEFAULT_RUN_CONFIG);
    const { lastFrame } = render(
      <StatusBar
        state={base}
        linked
        narration={null}
        relics={['Rusty Blade', 'Lucky Coin']}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('relics:');
    expect(frame).toContain('Rusty Blade');
    expect(frame).toContain('Lucky Coin');
  });

  it('omits the relics line entirely when the player holds none', () => {
    const base = createRun(content, 'statusbar-test', DEFAULT_RUN_CONFIG);
    const { lastFrame } = render(
      <StatusBar state={base} linked narration={null} relics={[]} />,
    );
    expect(lastFrame() ?? '').not.toContain('relics:');
  });

  it('surfaces the player combat statuses with the canonical glyph', () => {
    // Same canonical glyph (icon + identity color + format) as enemy tags and
    // intent chips: `<ICON> <N>` with a space.
    const { lastFrame } = render(
      <StatusBar
        state={combatState({ strength: 2, vulnerable: 1 })}
        linked
        narration={null}
        relics={[]}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('STR 2');
    expect(frame).toContain('VUL 1');
    // HUD combat fields stay anchored.
    expect(frame).toContain('BLK 0');
    expect(frame).toContain('EN 3/3');
  });

  it('shows the draw + discard pile counts in combat (the reshuffle clock)', () => {
    const base = createRun(content, 'statusbar-test', DEFAULT_RUN_CONFIG);
    const combat: CombatState = {
      enemies: [],
      hand: ['a', 'b', 'c'],
      drawPile: ['d', 'e', 'f', 'g'],
      discardPile: ['h', 'i'],
      energy: 3,
      maxEnergy: 3,
      playerHp: base.hp,
      playerMaxHp: base.maxHp,
      playerBlock: 0,
      playerStatuses: {},
      turn: 1,
      dealt: 0,
      taken: 0,
      slain: 0,
    };
    const state: RunState = { ...base, phase: 'combat', combat };
    const { lastFrame } = render(
      <StatusBar state={state} linked narration={null} relics={[]} />,
    );
    const frame = lastFrame() ?? '';
    // Counts match the live pile lengths.
    expect(frame).toContain(`draw ${combat.drawPile.length}`); // draw 4
    expect(frame).toContain(`disc ${combat.discardPile.length}`); // disc 2
    expect(frame).toContain(`hand ${combat.hand.length}`); // hand 3
    // In combat the redundant whole-deck count is dropped in favor of the piles.
    expect(frame).not.toContain('deck ');
  });

  it('omits the pile counts (and shows deck N) outside combat', () => {
    const base = createRun(content, 'statusbar-test', DEFAULT_RUN_CONFIG);
    const { lastFrame } = render(
      <StatusBar state={base} linked narration={null} relics={[]} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).not.toContain('draw ');
    expect(frame).not.toContain('disc ');
    expect(frame).toContain(`deck ${base.deck.length}`);
  });

  it('keeps the worst-case combat row 1 within contentWidth with 6 statuses', () => {
    // Row 1 carries HP/BLK/EN + every player status chip + gold/pots. The pile
    // counts live on their OWN row, so even a full slate of statuses cannot push
    // row 1 past contentWidth (76).
    const state = combatState({
      strength: 9,
      dexterity: 9,
      vulnerable: 9,
      weak: 9,
      regen: 9,
      poison: 9,
    });
    const { lastFrame } = render(
      <StatusBar state={state} linked narration={null} relics={[]} />,
    );
    const frame = lastFrame() ?? '';
    for (const line of frame.split('\n')) {
      expect(line.length).toBeLessThanOrEqual(76);
    }
    // Pile clock still present on its own line.
    expect(frame).toContain('draw ');
    expect(frame).toContain('disc ');
  });

  it('shows no status brackets in combat when the player has none', () => {
    const { lastFrame } = render(
      <StatusBar state={combatState({})} linked narration={null} relics={[]} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).not.toContain('STR');
    expect(frame).not.toContain('VUL');
  });

  it('shows a +Nblk beat when block rose on the last action (V6 juice)', () => {
    const start = combatState({});
    const raised: RunState = {
      ...start,
      combat: { ...(start.combat as CombatState), playerBlock: 5 },
    };
    const { lastFrame, rerender } = render(
      <StatusBar state={start} linked narration={null} relics={[]} />,
    );
    expect(lastFrame() ?? '').not.toContain('+5blk'); // no prior on first render
    rerender(<StatusBar state={raised} linked narration={null} relics={[]} />);
    expect(lastFrame() ?? '').toContain('+5blk');
  });

  it('shows a +Ng gold beat when gold rose on the last action (V6 juice)', () => {
    const start = createRun(content, 'statusbar-test', DEFAULT_RUN_CONFIG);
    const richer: RunState = { ...start, gold: start.gold + 25 };
    const { lastFrame, rerender } = render(
      <StatusBar state={start} linked={false} narration={null} relics={[]} />,
    );
    rerender(<StatusBar state={richer} linked={false} narration={null} relics={[]} />);
    expect(lastFrame() ?? '').toContain('+25g');
  });

  it('shows a +Nhp beat when HP rose on the last action (V6 juice)', () => {
    const start = createRun(content, 'statusbar-test', DEFAULT_RUN_CONFIG);
    const hurt: RunState = { ...start, hp: start.hp - 10 };
    const healed: RunState = { ...start, hp: start.hp - 4 };
    const { lastFrame, rerender } = render(
      <StatusBar state={hurt} linked={false} narration={null} relics={[]} />,
    );
    rerender(<StatusBar state={healed} linked={false} narration={null} relics={[]} />);
    expect(lastFrame() ?? '').toContain('+6hp');
  });
});
