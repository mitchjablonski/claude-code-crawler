import type { ContentRegistry } from '../types.js';
import type { RunConfig } from '../run.js';
import { cards } from './cards.js';
import { enemies } from './enemies.js';
import { relics } from './relics.js';
import { events } from './events.js';

export const content: ContentRegistry = Object.freeze({
  cards,
  enemies,
  relics,
  events,
});

export const STARTER_DECK: readonly string[] = [
  'rusty-shortsword',
  'rusty-shortsword',
  'rusty-shortsword',
  'rusty-shortsword',
  'rusty-shortsword',
  'battered-buckler',
  'battered-buckler',
  'battered-buckler',
  'battered-buckler',
];

export const DEFAULT_RUN_CONFIG: RunConfig = Object.freeze({
  starterDeck: STARTER_DECK,
  maxHp: 70,
  startingGold: 50,
  startingRelics: ['pocket-dice'],
});
