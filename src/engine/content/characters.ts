export interface Character {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly starterDeck: readonly string[];
  readonly startingRelics: readonly string[];
  readonly maxHp: number;
}

// D20: reworked from 5x shortsword + 4x buckler (9 cards, heavily redundant —
// the extra shortswords were dead draws and the Knight had no kit identity).
// Now 4x shortsword + 3x buckler + the two guardian-identity starters: a
// block+draw tempo card (Oath-Keeper) that cuts dead draws, and a
// block+self-strength card (Vanguard Stance) that gives the Knight a real
// scaling lean. Still 9 cards, 1 cost each, coherent block/strength guardian.
const KNIGHT_DECK: readonly string[] = [
  'rusty-shortsword',
  'rusty-shortsword',
  'rusty-shortsword',
  'rusty-shortsword',
  'battered-buckler',
  'battered-buckler',
  'battered-buckler',
  'oath-keeper',
  'vanguard-stance',
];

const APOTHECARY_DECK: readonly string[] = [
  'rusty-shortsword',
  'rusty-shortsword',
  'rusty-shortsword',
  'rusty-shortsword',
  'battered-buckler',
  'battered-buckler',
  'battered-buckler',
  'tipped-blade',
  'tipped-blade',
];

export const CHARACTERS: Readonly<Record<string, Character>> = {
  knight: {
    id: 'knight',
    name: 'Knight',
    description: 'A stalwart guardian. Stacks Block and Strength, then strikes.',
    starterDeck: KNIGHT_DECK,
    startingRelics: ['pocket-dice'],
    maxHp: 70,
  },
  apothecary: {
    id: 'apothecary',
    name: 'Apothecary',
    description: 'Fragile but venomous — opens with Poison, but thin on armor.',
    starterDeck: APOTHECARY_DECK,
    startingRelics: ['pocket-dice'],
    maxHp: 64,
  },
};

export const DEFAULT_CHARACTER = 'knight';
export const CHARACTER_IDS: readonly string[] = ['knight', 'apothecary'];
