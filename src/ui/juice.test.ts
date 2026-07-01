import { describe, expect, it } from 'vitest';
import { statusBeats, bigHit, BIG_HIT_THRESHOLD } from './juice.js';
import type { Statuses } from '../engine/types.js';

describe('statusBeats (V6 status-change diff)', () => {
  it('returns no beats when there is no prior (first render)', () => {
    expect(statusBeats(null, { vulnerable: 2 })).toEqual([]);
  });

  it('returns no beats when nothing changed', () => {
    const s: Statuses = { strength: 1, vulnerable: 2 };
    expect(statusBeats({ strength: 1, vulnerable: 2 }, s)).toEqual([]);
  });

  it('surfaces a +N beat for a newly applied / increased status', () => {
    expect(statusBeats({}, { vulnerable: 2 })).toEqual([{ id: 'vulnerable', delta: 2 }]);
    expect(statusBeats({ strength: 1 }, { strength: 3 })).toEqual([
      { id: 'strength', delta: 2 },
    ]);
  });

  it('surfaces a -N beat for a decreased / cleared status (decay / tick)', () => {
    expect(statusBeats({ poison: 3 }, { poison: 2 })).toEqual([{ id: 'poison', delta: -1 }]);
    // A status that dropped to zero (cleared from the map) still reads as a loss.
    expect(statusBeats({ weak: 1 }, {})).toEqual([{ id: 'weak', delta: -1 }]);
  });

  it('emits one beat per changed status, current-key order first', () => {
    const beats = statusBeats({ weak: 2 }, { vulnerable: 2, weak: 1 });
    // vulnerable (a current key) precedes weak; both changed.
    expect(beats).toEqual([
      { id: 'vulnerable', delta: 2 },
      { id: 'weak', delta: -1 },
    ]);
  });
});

describe('bigHit magnitude emphasis (V6)', () => {
  it('is true at/above the threshold and false below', () => {
    expect(bigHit(BIG_HIT_THRESHOLD)).toBe(true);
    expect(bigHit(BIG_HIT_THRESHOLD + 5)).toBe(true);
    expect(bigHit(BIG_HIT_THRESHOLD - 1)).toBe(false);
    expect(bigHit(0)).toBe(false);
  });
});
