import { generateMap } from './map.js';
import { initStreams, withStream, type Rng } from './rng.js';
import {
  applyRelics,
  endTurn,
  isCombatLost,
  isCombatWon,
  playCard,
  startCombat,
  usePotion,
} from './combat.js';
import { addStatus } from './effects.js';
import { UPGRADE_TARGET_IDS } from './content/cards.js';
import type {
  CardDef,
  ContentRegistry,
  EventOutcome,
  GameAction,
  MapNode,
  PotionDef,
  Rarity,
  RunState,
  SimpleEventOutcome,
  StatusId,
} from './types.js';
import { EngineError, eventCheckValue, eventRequirementMet } from './types.js';

export interface RunConfig {
  readonly starterDeck: readonly string[];
  readonly maxHp: number;
  readonly startingGold: number;
  readonly startingRelics: readonly string[];
  readonly tempoHint?: number;
  /** Difficulty enemy-HP multiplier (default 1 = neutral). */
  readonly enemyHpMult?: number;
  /** Number of acts (1 = single session, 3 = multi-act arc). Default 1. */
  readonly acts?: number;
  /** Potion slot limit (default 3). */
  readonly maxPotions?: number;
  /** Potions the run begins with (default none). */
  readonly startingPotions?: readonly string[];
}

export const DEFAULT_MAX_POTIONS = 3;

export function createRun(
  content: ContentRegistry,
  seed: string,
  config: RunConfig,
): RunState {
  const streams = initStreams(seed);
  const [map, rng] = withStream(streams, 'map', (r) =>
    generateMap(r, { tempoHint: config.tempoHint, acts: config.acts ?? 1 }),
  );
  return {
    seed,
    rng,
    map,
    currentNodeId: map.startId,
    phase: 'map',
    hp: config.maxHp,
    maxHp: config.maxHp,
    gold: config.startingGold,
    deck: [...config.starterDeck],
    relics: [...config.startingRelics],
    potions: [...(config.startingPotions ?? [])],
    maxPotions: config.maxPotions ?? DEFAULT_MAX_POTIONS,
    combat: null,
    reward: null,
    shop: null,
    event: null,
    modifiers: { nextCombatStatuses: {}, queuedEliteIds: [] },
    enemyHpMult: config.enemyHpMult ?? 1,
  };
}

export function applyAction(
  content: ContentRegistry,
  state: RunState,
  action: GameAction,
): RunState {
  switch (action.type) {
    case 'chooseNode':
      return chooseNode(content, state, action.nodeId);
    case 'playCard':
      return inCombat(content, state, (rng, s) =>
        playCard(content, requireCombat(s), action.handIndex, action.targetIndex, rng),
      );
    case 'usePotion':
      return usePotionAction(content, state, action.potionIndex, action.targetIndex);
    case 'endTurn':
      return inCombat(content, state, (rng, s) => {
        let combat = endTurn(content, requireCombat(s), rng);
        if (!isCombatWon(combat) && !isCombatLost(combat)) {
          combat = applyRelics(content, combat, s.relics, 'turnStart', rng);
        }
        return combat;
      });
    case 'pickRewardCard': {
      requirePhase(state, 'reward');
      const cardId = state.reward?.cards[action.index];
      if (cardId === undefined) throw new EngineError(`no reward card at ${action.index}`);
      return {
        ...grantRewardPotion(state),
        deck: [...state.deck, cardId],
        reward: null,
        phase: 'map',
      };
    }
    case 'skipReward':
      requirePhase(state, 'reward');
      return { ...grantRewardPotion(state), reward: null, phase: 'map' };
    case 'buyCard': {
      requirePhase(state, 'shop');
      const item = state.shop?.stock[action.index];
      if (!item || item.sold) throw new EngineError(`nothing to buy at ${action.index}`);
      if (state.gold < item.price) throw new EngineError('not enough gold');
      return {
        ...state,
        gold: state.gold - item.price,
        deck: [...state.deck, item.cardId],
        shop: {
          ...state.shop!,
          stock: state.shop!.stock.map((s, i) =>
            i === action.index ? { ...s, sold: true } : s,
          ),
        },
      };
    }
    case 'buyPotion': {
      requirePhase(state, 'shop');
      const item = state.shop?.potionStock[action.index];
      if (!item || item.sold) throw new EngineError(`no potion to buy at ${action.index}`);
      if (state.gold < item.price) throw new EngineError('not enough gold');
      if (state.potions.length >= state.maxPotions) throw new EngineError('satchel full');
      return {
        ...state,
        gold: state.gold - item.price,
        potions: [...state.potions, item.potionId],
        shop: {
          ...state.shop!,
          potionStock: state.shop!.potionStock.map((s, i) =>
            i === action.index ? { ...s, sold: true } : s,
          ),
        },
      };
    }
    case 'leaveShop':
      requirePhase(state, 'shop');
      return { ...state, shop: null, phase: 'map' };
    case 'rest': {
      requirePhase(state, 'rest');
      const healed = Math.min(state.maxHp, state.hp + Math.floor(state.maxHp * 0.2));
      return { ...state, hp: healed, phase: 'map' };
    }
    case 'upgradeCard': {
      requirePhase(state, 'rest');
      const cardId = state.deck[action.deckIndex];
      if (cardId === undefined) throw new EngineError(`no deck card at ${action.deckIndex}`);
      const card = content.cards[cardId];
      if (!card) throw new EngineError(`unknown card ${cardId}`);
      const upgradeId = card.upgradeTo;
      if (upgradeId === undefined) throw new EngineError(`${cardId} has no upgrade`);
      if (!content.cards[upgradeId]) throw new EngineError(`unknown upgrade ${upgradeId}`);
      return {
        ...state,
        deck: state.deck.map((id, i) => (i === action.deckIndex ? upgradeId : id)),
        phase: 'map',
      };
    }
    case 'chooseEventOption': {
      requirePhase(state, 'event');
      return chooseEventOption(content, state, action.index);
    }
    case 'continueEvent': {
      requirePhase(state, 'event');
      if (!state.event?.result) throw new EngineError('no event result to continue from');
      return { ...state, event: null, phase: 'map' };
    }
  }
}

// ---- node entry ----

function chooseNode(content: ContentRegistry, state: RunState, nodeId: string): RunState {
  requirePhase(state, 'map');
  const current = state.map.nodes[state.currentNodeId];
  if (!current || !current.next.includes(nodeId)) {
    throw new EngineError(`no path from ${state.currentNodeId} to ${nodeId}`);
  }
  const node = state.map.nodes[nodeId] as MapNode;
  const moved = { ...state, currentNodeId: nodeId };

  switch (node.kind) {
    case 'combat': {
      const queued = moved.modifiers.queuedEliteIds;
      const enemyIds = rollEncounter(content, moved, node);
      if (queued.length === 0 || node.row < 3) return enterCombat(content, moved, enemyIds);
      const consumed: RunState = {
        ...moved,
        modifiers: { ...moved.modifiers, queuedEliteIds: queued.slice(1) },
      };
      return enterCombat(content, consumed, [...enemyIds, queued[0] as string]);
    }
    case 'elite':
      return enterRolledCombat(content, moved, 'elite');
    case 'boss':
      return enterRolledCombat(content, moved, 'boss');
    case 'shop':
      return enterShop(content, moved);
    case 'rest':
      return { ...moved, phase: 'rest' };
    case 'event':
      return enterEvent(content, moved);
    case 'start':
      throw new EngineError('cannot re-enter the start node');
  }
}

type PoolKind = 'normal' | 'elite' | 'boss';

function enemyPool(content: ContentRegistry, kind: PoolKind, maxTier = Infinity): string[] {
  return Object.values(content.enemies)
    .filter((e) => {
      const typeOk =
        kind === 'boss' ? e.isBoss : kind === 'elite' ? e.isElite : !e.isBoss && !e.isElite;
      if (!typeOk) return false;
      if (kind === 'normal') return (e.tier ?? 1) <= maxTier;
      return true;
    })
    .map((e) => e.id)
    .sort();
}

function enterRolledCombat(
  content: ContentRegistry,
  state: RunState,
  kind: Exclude<PoolKind, 'normal'>,
): RunState {
  const pool = enemyPool(content, kind);
  if (pool.length === 0) throw new EngineError(`no ${kind} enemies in content`);
  const [enemyId, rng] = withStream(state.rng, 'combat', (r) => r.pick(pool));
  return enterCombat(content, { ...state, rng }, [enemyId]);
}

function rollEncounter(
  content: ContentRegistry,
  state: RunState,
  node: MapNode,
): string[] {
  // Deeper acts admit higher enemy tiers and bigger packs.
  const tiered = enemyPool(content, 'normal', node.act + 1);
  const pool = tiered.length > 0 ? tiered : enemyPool(content, 'normal');
  if (pool.length === 0) throw new EngineError('no normal enemies in content');
  const [ids] = withStream(state.rng, 'combat', (rng) => {
    let count: number;
    if (node.act === 0) count = node.row <= 2 ? 1 : rng.next() < 0.5 ? 1 : 2;
    else if (node.act === 1) count = 2;
    else count = rng.next() < 0.5 ? 2 : 3;
    return Array.from({ length: count }, () => rng.pick(pool));
  });
  return ids;
}

function enterCombat(
  content: ContentRegistry,
  state: RunState,
  enemyIds: readonly string[],
): RunState {
  const [initialCombat, rng] = withStream(state.rng, 'combat', (r) =>
    startCombat(content, state.deck, state.hp, state.maxHp, state.relics, enemyIds, r, state.enemyHpMult),
  );
  let combat = initialCombat;
  // Consume any pending blessing from bounded modifiers.
  const bless = Object.entries(state.modifiers.nextCombatStatuses) as [StatusId, number][];
  let next = state;
  if (bless.length > 0) {
    let statuses = combat.playerStatuses;
    for (const [status, stacks] of bless) statuses = addStatus(statuses, status, stacks);
    combat = { ...combat, playerStatuses: statuses };
    next = { ...state, modifiers: { ...state.modifiers, nextCombatStatuses: {} } };
  }
  return { ...next, rng, combat, phase: 'combat' };
}

function usePotionAction(
  content: ContentRegistry,
  state: RunState,
  potionIndex: number,
  targetIndex: number | undefined,
): RunState {
  requirePhase(state, 'combat');
  const potionId = state.potions[potionIndex];
  if (potionId === undefined) throw new EngineError(`no potion at index ${potionIndex}`);
  const potion = content.potions[potionId] as PotionDef | undefined;
  if (!potion) throw new EngineError(`unknown potion ${potionId}`);
  // Remove the consumed potion first; usePotion validation runs in the combat
  // stream below and throws before any state is committed if the use is illegal.
  const consumed: RunState = {
    ...state,
    potions: state.potions.filter((_, i) => i !== potionIndex),
  };
  return inCombat(content, consumed, (rng, s) =>
    usePotion(potion, requireCombat(s), targetIndex, rng),
  );
}

/** If the resolved reward carries a potion and there's a free slot, add it. */
function grantRewardPotion(state: RunState): RunState {
  const potionId = state.reward?.potionId;
  if (potionId === undefined || state.potions.length >= state.maxPotions) return state;
  return { ...state, potions: [...state.potions, potionId] };
}

function inCombat(
  content: ContentRegistry,
  state: RunState,
  fn: (rng: Rng, state: RunState) => RunState['combat'],
): RunState {
  requirePhase(state, 'combat');
  const [combat, rng] = withStream(state.rng, 'combat', (r) => fn(r, state));
  if (!combat) throw new EngineError('combat handler returned no state');
  const next = { ...state, rng, combat };
  if (isCombatLost(combat)) {
    return { ...next, hp: 0, phase: 'defeat', combat: null };
  }
  if (isCombatWon(combat)) {
    return finishCombat(content, { ...next, hp: combat.playerHp });
  }
  return next;
}

function finishCombat(content: ContentRegistry, state: RunState): RunState {
  const node = state.map.nodes[state.currentNodeId] as MapNode;
  if (node.kind === 'boss') {
    return { ...state, combat: null, phase: 'victory' };
  }
  const isElite = node.kind === 'elite';
  const hasPotionSlot = state.potions.length < state.maxPotions;
  const [reward, rng] = withStream(state.rng, 'loot', (r) => {
    const gold = isElite ? r.intBetween(30, 50) : r.intBetween(15, 30);
    const cards = rollCardChoices(content, r, 3);
    let relicId: string | undefined;
    if (isElite) {
      const unowned = Object.keys(content.relics)
        .filter((id) => !state.relics.includes(id))
        .sort();
      if (unowned.length > 0) relicId = r.pick(unowned);
    }
    // Roll the potion LAST so existing gold/card/relic rolls keep their order;
    // only the trailing roll shifts loot fixtures.
    let potionId: string | undefined;
    if (r.int(4) === 0 && hasPotionSlot) potionId = r.pick(potionIds(content));
    return { gold, cards, relicId, potionId };
  });
  const baseReward = { cards: reward.cards, gold: reward.gold };
  return {
    ...state,
    rng,
    combat: null,
    gold: state.gold + reward.gold,
    relics: reward.relicId ? [...state.relics, reward.relicId] : state.relics,
    reward: {
      ...baseReward,
      ...(reward.relicId ? { relicId: reward.relicId } : {}),
      ...(reward.potionId ? { potionId: reward.potionId } : {}),
    },
    phase: 'reward',
  };
}

function potionIds(content: ContentRegistry): string[] {
  return Object.keys(content.potions).sort();
}

// ---- loot / shop / events ----

const RARITY_WEIGHTS: readonly [Rarity, number][] = [
  ['common', 0.6],
  ['uncommon', 0.3],
  ['rare', 0.1],
];

function rollCardChoices(content: ContentRegistry, rng: Rng, count: number): string[] {
  const byRarity = new Map<Rarity, CardDef[]>();
  for (const card of Object.values(content.cards).sort((a, b) => a.id.localeCompare(b.id))) {
    if (card.rarity === 'starter') continue;
    // Upgraded variants are reachable only by upgrading at a rest — never drafted.
    if (UPGRADE_TARGET_IDS.has(card.id)) continue;
    byRarity.set(card.rarity, [...(byRarity.get(card.rarity) ?? []), card]);
  }
  const choices: string[] = [];
  for (let i = 0; i < count * 10 && choices.length < count; i++) {
    let roll = rng.next();
    let rarity: Rarity = 'common';
    for (const [r, w] of RARITY_WEIGHTS) {
      roll -= w;
      if (roll < 0) {
        rarity = r;
        break;
      }
    }
    const pool = byRarity.get(rarity);
    if (!pool || pool.length === 0) continue;
    const picked = rng.pick(pool);
    if (!choices.includes(picked.id)) choices.push(picked.id);
  }
  return choices;
}

const SHOP_PRICES: Readonly<Record<Rarity, number>> = {
  starter: 0,
  common: 50,
  uncommon: 75,
  rare: 110,
};

/** Potion shop prices by rarity (cheaper than cards: a one-shot, not permanent). */
const POTION_PRICES: Readonly<Record<Rarity, number>> = {
  starter: 20,
  common: 35,
  uncommon: 55,
  rare: 80,
};

const SHOP_POTION_COUNT = 2;

function enterShop(content: ContentRegistry, state: RunState): RunState {
  const [shop, rng] = withStream(state.rng, 'loot', (r) => {
    // Card stock rolls FIRST so existing shop fixtures keep their card rolls;
    // the potion rolls are appended afterwards on the same stream.
    const stock = rollCardChoices(content, r, 3).map((cardId) => {
      const card = content.cards[cardId] as CardDef;
      return {
        cardId,
        price: SHOP_PRICES[card.rarity] + r.intBetween(-5, 5),
        sold: false,
      };
    });
    const ids = potionIds(content);
    const potionStock = Array.from({ length: SHOP_POTION_COUNT }, () => {
      const potionId = r.pick(ids);
      const potion = content.potions[potionId] as PotionDef;
      return {
        potionId,
        price: POTION_PRICES[potion.rarity ?? 'common'] + r.intBetween(-5, 5),
        sold: false,
      };
    });
    return { stock, potionStock };
  });
  return { ...state, rng, shop, phase: 'shop' };
}

function enterEvent(content: ContentRegistry, state: RunState): RunState {
  const ids = Object.keys(content.events).sort();
  if (ids.length === 0) throw new EngineError('no narrative events in content');
  const [eventId, rng] = withStream(state.rng, 'events', (r) => r.pick(ids));
  return { ...state, rng, event: { eventId }, phase: 'event' };
}

function chooseEventOption(
  content: ContentRegistry,
  state: RunState,
  index: number,
): RunState {
  const def = state.event ? content.events[state.event.eventId] : undefined;
  if (!def) throw new EngineError('no active event');
  const eventId = state.event!.eventId;
  const option = def.options[index];
  if (!option) throw new EngineError(`no event option at ${index}`);
  if (!eventRequirementMet(state, option.requires)) {
    throw new EngineError(`event option ${index} is not available`);
  }

  // Flatten the chosen outcomes into concrete simple outcomes. Probabilistic
  // rolls draw from the 'events' stream (so replay is byte-identical); the
  // 'events' stream's advanced state is folded back into rng. Conditionals read
  // the pre-resolution player state (a snapshot), keeping resolution order-free.
  const [resolved, rng] = withStream(state.rng, 'events', (r) =>
    flattenOutcomes(option.outcomes, state, r),
  );

  // Apply the simple outcomes immutably (same arithmetic as before).
  let next: RunState = { ...state, rng };
  for (const outcome of resolved.applied) {
    switch (outcome.kind) {
      case 'gainGold':
        next = { ...next, gold: next.gold + outcome.amount };
        break;
      case 'loseGold':
        next = { ...next, gold: Math.max(0, next.gold - outcome.amount) };
        break;
      case 'loseHp':
        next = { ...next, hp: Math.max(0, next.hp - outcome.amount) };
        break;
      case 'gainMaxHp':
        next = {
          ...next,
          maxHp: next.maxHp + outcome.amount,
          hp: next.hp + outcome.amount,
        };
        break;
      case 'gainCard':
        next = { ...next, deck: [...next.deck, outcome.cardId] };
        break;
      case 'gainRelic':
        next = { ...next, relics: [...next.relics, outcome.relicId] };
        break;
    }
  }

  // Lethal outcome → straight to defeat (no result screen).
  if (next.hp <= 0) return { ...next, event: null, phase: 'defeat' };

  // Nothing applied (e.g. "Walk away") → straight back to the map.
  if (resolved.applied.length === 0) {
    return { ...next, event: null, phase: 'map' };
  }

  // Otherwise stay in the event phase and show a result screen.
  return {
    ...next,
    event: { eventId, result: { applied: resolved.applied, rolled: resolved.rolled } },
    phase: 'event',
  };
}

/**
 * Resolve an option's (possibly composite) outcomes into a flat list of simple
 * outcomes. Rolls advance `r` (the 'events' stream); conditionals branch on the
 * passed-in state snapshot. Composites are one level deep — branches/clauses
 * contain only simple outcomes — so no recursion past this single expansion is
 * required.
 */
function flattenOutcomes(
  outcomes: readonly EventOutcome[],
  state: RunState,
  r: Rng,
): { applied: SimpleEventOutcome[]; rolled: boolean } {
  const applied: SimpleEventOutcome[] = [];
  let rolled = false;
  for (const outcome of outcomes) {
    switch (outcome.kind) {
      case 'rollOutcomes': {
        rolled = true;
        const branch = pickBranch(outcome.branches, outcome.weights, r);
        applied.push(...branch);
        break;
      }
      case 'conditional': {
        const pass = eventCheckValue(state, outcome.check) >= outcome.atLeast;
        applied.push(...(pass ? outcome.ifPass : outcome.ifFail));
        break;
      }
      default:
        applied.push(outcome);
        break;
    }
  }
  return { applied, rolled };
}

/** Pick one branch uniformly, or by `weights` if provided, from the 'events' rng. */
function pickBranch(
  branches: readonly (readonly SimpleEventOutcome[])[],
  weights: readonly number[] | undefined,
  r: Rng,
): readonly SimpleEventOutcome[] {
  if (branches.length === 0) return [];
  if (!weights) return r.pick(branches);
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = r.next() * total;
  for (let i = 0; i < branches.length; i++) {
    roll -= weights[i] ?? 0;
    if (roll < 0) return branches[i] as readonly SimpleEventOutcome[];
  }
  return branches[branches.length - 1] as readonly SimpleEventOutcome[];
}

// ---- guards ----

function requirePhase(state: RunState, phase: RunState['phase']): void {
  if (state.phase !== phase) {
    throw new EngineError(`action requires phase ${phase}, but run is in ${state.phase}`);
  }
}

function requireCombat(state: RunState): NonNullable<RunState['combat']> {
  if (!state.combat) throw new EngineError('no combat in progress');
  return state.combat;
}
