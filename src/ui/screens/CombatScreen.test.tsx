import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { CombatScreen } from './CombatScreen.js';
import { createRun } from '../../engine/run.js';
import { DEFAULT_RUN_CONFIG, content } from '../../engine/content/index.js';
import type { CombatState, EnemyInstance, RunState } from '../../engine/types.js';

/** Build a single-enemy combat RunState whose lone enemy is on `nextMoveIndex`. */
function combatWith(defId: string, nextMoveIndex: number): RunState {
  const base = createRun(content, 'intent-test', DEFAULT_RUN_CONFIG);
  const def = content.enemies[defId];
  if (!def) throw new Error(`unknown enemy ${defId}`);
  const enemy: EnemyInstance = {
    defId,
    name: def.name,
    hp: def.hp[1],
    maxHp: def.hp[1],
    block: 0,
    statuses: {},
    nextMoveIndex,
  };
  const combat: CombatState = {
    enemies: [enemy],
    hand: [],
    drawPile: [],
    discardPile: [],
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
  return { ...base, phase: 'combat', combat };
}

/** Same combat with the lone enemy's hp overridden (to simulate a hit/kill). */
function withEnemyHp(state: RunState, hp: number): RunState {
  const combat = state.combat as CombatState;
  const enemy = combat.enemies[0] as EnemyInstance;
  return {
    ...state,
    combat: { ...combat, enemies: [{ ...enemy, hp }] },
  };
}

/** Build a multi-enemy combat RunState (all enemies full HP, on move 0). */
function multiCombat(defIds: readonly string[], hand: readonly string[] = []): RunState {
  const base = createRun(content, 'multi-test', DEFAULT_RUN_CONFIG);
  const enemies: EnemyInstance[] = defIds.map((defId) => {
    const def = content.enemies[defId];
    if (!def) throw new Error(`unknown enemy ${defId}`);
    return {
      defId,
      name: def.name,
      hp: def.hp[1],
      maxHp: def.hp[1],
      block: 0,
      statuses: {},
      nextMoveIndex: 0,
    };
  });
  const combat: CombatState = {
    enemies,
    hand: [...hand],
    drawPile: [],
    discardPile: [],
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
  return { ...base, phase: 'combat', combat };
}

const noop = () => {};

describe('CombatScreen multi-enemy separation (#72)', () => {
  it('separates stacked enemy blocks with a blank row so each reads as a unit', () => {
    const { lastFrame } = render(
      <CombatScreen
        state={multiCombat(['lint-goblin', 'skeleton-intern'])}
        content={content}
        dispatch={noop}
      />,
    );
    const lines = (lastFrame() ?? '').split('\n');
    const first = lines.findIndex((l) => l.includes('Lint Goblin'));
    const second = lines.findIndex((l) => l.includes('Skeleton Intern'));
    expect(first).toBeGreaterThanOrEqual(0);
    expect(second).toBeGreaterThan(first);
    // A blank separator row sits between the first enemy's block (header+detail)
    // and the second enemy's header — the marginBottom gap that groups each unit.
    expect(lines.slice(first, second).some((l) => l.trim() === '')).toBe(true);
  });

  it('does NOT add a trailing gap after the last enemy (budget-aware spacing)', () => {
    const { lastFrame } = render(
      <CombatScreen
        state={multiCombat(['lint-goblin', 'skeleton-intern'])}
        content={content}
        dispatch={noop}
      />,
    );
    const lines = (lastFrame() ?? '').split('\n');
    // The last enemy is the Skeleton: its detail (HP bar) row is immediately
    // followed by the single hand-zone gap, not a gap+gap double blank.
    const detail = lines.findIndex(
      (l, i) => i > 0 && lines[i - 1]!.includes('Skeleton Intern') && l.includes('next:'),
    );
    expect(detail).toBeGreaterThan(0);
    // exactly one blank row before the "Your hand:" header (the zone seam).
    expect(lines[detail + 1]?.trim()).toBe('');
    expect(lines[detail + 2]?.trim()).not.toBe('');
  });
});

describe('CombatScreen intent telegraph', () => {
  it('shows BOTH the damage and the debuff chip for a multi-effect move', () => {
    // Lint Goblin move 1 = Style Violation: 9 damage + apply 2 Vulnerable to player.
    const { lastFrame } = render(
      <CombatScreen
        state={combatWith('lint-goblin', 1)}
        content={content}
        dispatch={noop}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('next:');
    expect(frame).toContain('Style Violation');
    expect(frame).toContain('9dmg'); // headline threat
    // Canonical status format (V5): identity color + `<ICON> <N>` with a space,
    // unified across enemy tags, player statuses, and intent chips (was `VUL2`).
    expect(frame).toContain('VUL 2'); // the debuff landing on the player
  });

  it('shows a multi-hit damage chip as NxTdmg', () => {
    // Lint Goblin move 0 = Nitpick: 4 damage x2.
    const { lastFrame } = render(
      <CombatScreen
        state={combatWith('lint-goblin', 0)}
        content={content}
        dispatch={noop}
      />,
    );
    expect(lastFrame() ?? '').toContain('4x2dmg');
  });

  it('shows a +Nblk chip for a pure-block move', () => {
    // Skeleton Intern move 1 = Coffee Break: block 6.
    const { lastFrame } = render(
      <CombatScreen
        state={combatWith('skeleton-intern', 1)}
        content={content}
        dispatch={noop}
      />,
    );
    expect(lastFrame() ?? '').toContain('+6blk');
  });

  it('shows a self-buff chip (ICON+N) for a buff move', () => {
    // Lint Goblin move 2 = Refactor Rage: block 8 + gain 1 Strength (self).
    const { lastFrame } = render(
      <CombatScreen
        state={combatWith('lint-goblin', 2)}
        content={content}
        dispatch={noop}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('+8blk');
    // Canonical status format (V5): self-buff keeps the `+` sign on the count but
    // now uses the unified `<ICON> +N` glyph (identity color + space), was `STR+1`.
    expect(frame).toContain('STR +1'); // enemy self-buff
  });
});

describe('CombatScreen juice beats (V6)', () => {
  it('shows no damage beat on the first combat render (no prior state)', () => {
    const { lastFrame } = render(
      <CombatScreen state={combatWith('skeleton-intern', 0)} content={content} dispatch={noop} />,
    );
    // First render has no prior to diff against → no `-N` beat anywhere.
    expect(lastFrame() ?? '').not.toMatch(/-\d+/);
  });

  it('shows a -N damage beat reflecting the HP lost on the last action', () => {
    const start = combatWith('skeleton-intern', 0);
    const full = (start.combat as CombatState).enemies[0]!.hp;
    const { lastFrame, rerender } = render(
      <CombatScreen state={start} content={content} dispatch={noop} />,
    );
    // The action lands: same combat object replaced with one where the enemy
    // took 7 damage → the diff surfaces a persistent `-7` beat.
    rerender(
      <CombatScreen state={withEnemyHp(start, full - 7)} content={content} dispatch={noop} />,
    );
    expect(lastFrame() ?? '').toContain('-7');
  });

  it('recomputes the beat on the next action (the old -N is gone)', () => {
    const start = combatWith('skeleton-intern', 0);
    const full = (start.combat as CombatState).enemies[0]!.hp;
    const { lastFrame, rerender } = render(
      <CombatScreen state={start} content={content} dispatch={noop} />,
    );
    rerender(<CombatScreen state={withEnemyHp(start, full - 7)} content={content} dispatch={noop} />);
    expect(lastFrame() ?? '').toContain('-7');
    // Next action deals 2 more (full-9): beat recomputes to the new delta only.
    rerender(<CombatScreen state={withEnemyHp(start, full - 9)} content={content} dispatch={noop} />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('-2');
    expect(frame).not.toContain('-7');
  });

  it('shows a DOWN beat on an enemy slain this action', () => {
    const start = combatWith('skeleton-intern', 0);
    const { lastFrame, rerender } = render(
      <CombatScreen state={start} content={content} dispatch={noop} />,
    );
    rerender(<CombatScreen state={withEnemyHp(start, 0)} content={content} dispatch={noop} />);
    expect(lastFrame() ?? '').toContain('DOWN');
  });

  it('surfaces an unplayable-card count in the footer when a card is unaffordable (#60)', () => {
    const start = combatWith('skeleton-intern', 0);
    const combat = start.combat as CombatState;
    // One affordable (cost<=energy) + two unaffordable cards at low energy.
    const cheap = Object.values(content.cards).find((c) => c.cost === 1)!;
    const dear = Object.values(content.cards).find((c) => c.cost >= 2)!;
    const state: RunState = {
      ...start,
      combat: { ...combat, hand: [cheap.id, dear.id, dear.id], energy: 1 },
    };
    const { lastFrame } = render(
      <CombatScreen state={state} content={content} dispatch={noop} />,
    );
    // Derived live from hand vs energy: two cards cost more than 1 energy.
    expect(lastFrame() ?? '').toContain('2 unplayable');
  });

  it('uses an ASCII-only separator in the footer — no U+00B7 middle dot (#71)', () => {
    const start = combatWith('skeleton-intern', 0);
    const combat = start.combat as CombatState;
    // A cost>=2 card at 0 energy is unplayable, so the separator before the
    // "N unplayable" segment is rendered.
    const dear = Object.values(content.cards).find((c) => c.cost >= 2)!;
    const state: RunState = {
      ...start,
      combat: { ...combat, hand: [dear.id], energy: 0 },
    };
    const { lastFrame } = render(
      <CombatScreen state={state} content={content} dispatch={noop} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('1 unplayable'); // separator segment is present
    expect(frame).not.toContain('·'); // ASCII-safe: no middle dot
  });

  it('shows NO unplayable hint when every card is affordable (#60)', () => {
    const start = combatWith('skeleton-intern', 0);
    const combat = start.combat as CombatState;
    const cheap = Object.values(content.cards).find((c) => c.cost <= 1)!;
    const state: RunState = {
      ...start,
      combat: { ...combat, hand: [cheap.id], energy: 3 },
    };
    const { lastFrame } = render(
      <CombatScreen state={state} content={content} dispatch={noop} />,
    );
    expect(lastFrame() ?? '').not.toContain('unplayable');
  });

  it('shows the LIVE gradient value of a missing-HP card, rising as HP drops (#65)', () => {
    // meltdown-jab: deal 5, +1 per 10 HP missing. At 30/60 missing = 30 → +3 → 8.
    const start = combatWith('skeleton-intern', 0);
    const combat = start.combat as CombatState;
    const state: RunState = {
      ...start,
      combat: { ...combat, hand: ['meltdown-jab'], playerHp: 30, playerMaxHp: 60 },
    };
    const { lastFrame } = render(
      <CombatScreen state={state} content={content} dispatch={noop} />,
    );
    // The effective number is surfaced (the "aha": hurt → bigger number).
    expect(lastFrame() ?? '').toContain('now 8 dmg');
  });

  it('shows only the base gradient value at full HP and NO live line for plain cards (#65)', () => {
    const start = combatWith('skeleton-intern', 0);
    const combat = start.combat as CombatState;
    // Full HP → bonus 0 → effective = base 5; a plain attack gets no live line.
    const state: RunState = {
      ...start,
      combat: { ...combat, hand: ['meltdown-jab', 'rusty-shortsword'], playerHp: 60, playerMaxHp: 60 },
    };
    const { lastFrame } = render(
      <CombatScreen state={state} content={content} dispatch={noop} />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('now 5 dmg'); // gradient card, base at full HP
    expect((frame.match(/now \d+ /g) ?? []).length).toBe(1); // only the gradient card
  });

  it('opens the deck overlay on [v] without dispatching a combat action (#56)', async () => {
    const tick = () => new Promise((resolve) => setTimeout(resolve, 25));
    const start = combatWith('skeleton-intern', 0);
    let opened = false;
    let dispatched = false;
    const { lastFrame, stdin } = render(
      <CombatScreen
        state={start}
        content={content}
        dispatch={() => {
          dispatched = true;
        }}
        onViewDeck={() => {
          opened = true;
        }}
      />,
    );
    // The affordance is advertised in the footer.
    expect(lastFrame() ?? '').toContain('[v] view deck');
    await tick();
    stdin.write('v');
    await tick();
    expect(opened).toBe(true); // overlay requested
    expect(dispatched).toBe(false); // read-only: no combat action fired
  });
});
