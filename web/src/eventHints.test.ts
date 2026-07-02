/**
 * eventHints: the web port of the terminal EventScreen's pure hint model must
 * keep the same contract — fixed deltas, gamble ranges (min..max, "maybe"
 * grants in parens), conditional clauses, and the outcome/aftermath lines.
 */
import { describe, expect, it } from 'vitest';
import { content } from '@game/engine/content/index.js';
import type { EventOutcome, NarrativeEventDef } from '@game/engine/types.js';
import { aftermathLine, optionHintSegments, outcomeLine, requireReason } from './eventHints.js';

const text = (outcomes: readonly EventOutcome[], mult = 1): string =>
  optionHintSegments(outcomes, content, mult)
    .map((s) => s.text)
    .join('');

describe('optionHintSegments', () => {
  it('shows fixed numeric deltas with signs', () => {
    expect(text([{ kind: 'gainGold', amount: 30 }])).toBe('+30g');
    expect(text([{ kind: 'loseHp', amount: 6 }])).toBe('-6 HP');
    expect(text([{ kind: 'loseGold', amount: 10 }, { kind: 'gainMaxHp', amount: 4 }])).toBe(
      '-10g, +4 max HP',
    );
  });

  it('scales loseHp hints by the difficulty multiplier (#34)', () => {
    expect(text([{ kind: 'loseHp', amount: 6 }], 1.5)).toBe('-9 HP');
  });

  it('shows min..max ranges across roll branches', () => {
    expect(
      text([
        {
          kind: 'rollOutcomes',
          branches: [[{ kind: 'gainGold', amount: 55 }], [{ kind: 'loseHp', amount: 8 }]],
        },
      ]),
    ).toBe('+0..+55g, -8..+0 HP');
  });

  it('marks a grant present in only some branches as a (maybe)', () => {
    const cardId = Object.keys(content.cards)[0]!;
    const name = content.cards[cardId]!.name;
    expect(
      text([
        {
          kind: 'rollOutcomes',
          branches: [[{ kind: 'gainCard', cardId }], [{ kind: 'gainGold', amount: 5 }]],
        },
      ]),
    ).toContain(`(${name})`);
  });

  it('summarizes conditional clauses compactly', () => {
    expect(
      text([
        {
          kind: 'conditional',
          check: 'relics',
          atLeast: 3,
          ifPass: [{ kind: 'loseHp', amount: 2 }],
          ifFail: [{ kind: 'loseHp', amount: 9 }],
        },
      ]),
    ).toBe('if relics>=3: -2 HP else -9 HP');
  });

  it('returns no segments for empty outcomes (walk away)', () => {
    expect(optionHintSegments([], content)).toHaveLength(0);
  });
});

describe('outcomeLine / requireReason / aftermathLine', () => {
  it('formats applied outcomes with terminal-identical strings', () => {
    expect(outcomeLine({ kind: 'gainGold', amount: 12 }, content)).toEqual({
      text: '+12 gold',
      good: true,
    });
    expect(outcomeLine({ kind: 'loseHp', amount: 4 }, content)).toEqual({
      text: '-4 HP',
      good: false,
    });
  });

  it('names the gating stat in the locked-option reason', () => {
    expect(requireReason({ check: 'gold', atLeast: 40 })).toBe('need 40 gold');
    expect(requireReason({ check: 'deck', atLeast: 8 })).toBe('need 8 cards');
  });

  it('prefers an authored aftermath, else picks deterministically by valence', () => {
    const authored = {
      aftermath: { win: 'W', loss: 'L' },
    } as unknown as NarrativeEventDef;
    expect(aftermathLine(authored, [{ kind: 'gainGold', amount: 5 }])).toBe('W');
    expect(aftermathLine(authored, [{ kind: 'loseHp', amount: 5 }])).toBe('L');
    const bare = {} as NarrativeEventDef;
    expect(aftermathLine(bare, [{ kind: 'loseHp', amount: 5 }])).toBe(
      aftermathLine(bare, [{ kind: 'loseHp', amount: 5 }]),
    );
  });
});
