import type { RngStreams } from './rng.js';

// ---- Effects: the closed primitive set every system composes from ----

export type TargetKind = 'enemy' | 'allEnemies' | 'self';
export type StatusId = 'strength' | 'vulnerable' | 'weak' | 'regen' | 'poison' | 'dexterity';

export type Effect =
  | { kind: 'damage'; amount: number; target: TargetKind; times?: number }
  | { kind: 'block'; amount: number }
  | { kind: 'draw'; count: number }
  | { kind: 'gainEnergy'; amount: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'applyStatus'; status: StatusId; stacks: number; target: TargetKind };

export type Statuses = Partial<Readonly<Record<StatusId, number>>>;

// ---- Content definitions (data, injected via ContentRegistry) ----

export type CardType = 'attack' | 'skill' | 'power';
export type Rarity = 'starter' | 'common' | 'uncommon' | 'rare';

export interface CardDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: CardType;
  readonly rarity: Rarity;
  readonly cost: number;
  /** What the player must select when playing this card. */
  readonly target: TargetKind;
  readonly effects: readonly Effect[];
  /**
   * Id of the upgraded variant of this card, if any. Upgrading at a rest swaps
   * a deck slot to this id. Upgraded variants are NOT draftable (excluded from
   * reward/shop pools) and have no further `upgradeTo` (no chains this far).
   */
  readonly upgradeTo?: string;
}

/**
 * Potions are one-shot consumables used IN COMBAT. They compose the SAME
 * closed Effect set as cards (REQ: code decides, content composes) — no new
 * effect kinds or mechanics, only new data.
 */
export interface PotionDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** What the player must select when using this potion. */
  readonly target: TargetKind;
  readonly effects: readonly Effect[];
  /** Optional rarity, used only for shop pricing. */
  readonly rarity?: Rarity;
}

/** In enemy moves, target 'enemy' means the player. */
export interface EnemyMove {
  readonly name: string;
  readonly effects: readonly Effect[];
}

export interface EnemyDef {
  readonly id: string;
  readonly name: string;
  readonly hp: readonly [min: number, max: number];
  /** Moves cycle in order from a random starting index. */
  readonly moves: readonly EnemyMove[];
  readonly isElite?: boolean;
  readonly isBoss?: boolean;
  /** Normal-enemy act tier (1-3, default 1); higher tiers appear deeper in an arc. */
  readonly tier?: number;
  /**
   * Optional short ASCII emblem shown next to the enemy in combat (e.g. `>_<`).
   * Pure flavor/presentation — never required and never read by the engine.
   */
  readonly sigil?: string;
}

export interface RelicDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly trigger: 'combatStart' | 'turnStart';
  readonly effects: readonly Effect[];
}

/** Player-state fields an event can branch or gate on (deterministic). */
export type EventCheck = 'gold' | 'hp' | 'maxHp' | 'relics' | 'deck';

/**
 * The simple, directly-applicable outcome kinds. These are the only kinds that
 * ever end up in a resolved `applied` list (the composite kinds below flatten
 * down to these before application).
 */
export type SimpleEventOutcome =
  | { kind: 'gainGold'; amount: number }
  | { kind: 'loseGold'; amount: number }
  | { kind: 'loseHp'; amount: number }
  | { kind: 'gainMaxHp'; amount: number }
  | { kind: 'gainCard'; cardId: string }
  | { kind: 'gainRelic'; relicId: string };

/**
 * Composite outcome kinds. Authored events may use these inside an option's
 * outcome list; the engine flattens them (resolving rolls via the 'events' RNG
 * stream and conditionals via the player state) into `SimpleEventOutcome`s
 * before applying. Branches/clauses are kept ONE level deep — they may contain
 * only simple kinds, never another roll/conditional (validated in content tests).
 */
export type EventOutcome =
  | SimpleEventOutcome
  | {
      kind: 'rollOutcomes';
      /** One branch is chosen via the 'events' stream (uniform, or by `weights`). */
      readonly branches: readonly (readonly SimpleEventOutcome[])[];
      readonly weights?: readonly number[];
    }
  | {
      kind: 'conditional';
      readonly check: EventCheck;
      readonly atLeast: number;
      readonly ifPass: readonly SimpleEventOutcome[];
      readonly ifFail: readonly SimpleEventOutcome[];
    };

/** A requirement gating whether an option is selectable. */
export interface EventRequirement {
  readonly check: EventCheck;
  readonly atLeast: number;
}

export interface NarrativeEventDef {
  readonly id: string;
  readonly name: string;
  readonly prompt: string;
  readonly options: readonly {
    readonly label: string;
    readonly outcomes: readonly EventOutcome[];
    /** If present, the option is selectable only when the requirement holds. */
    readonly requires?: EventRequirement;
  }[];
}

export interface ContentRegistry {
  readonly cards: Readonly<Record<string, CardDef>>;
  readonly enemies: Readonly<Record<string, EnemyDef>>;
  readonly relics: Readonly<Record<string, RelicDef>>;
  readonly events: Readonly<Record<string, NarrativeEventDef>>;
  readonly potions: Readonly<Record<string, PotionDef>>;
}

// ---- Map ----

export type NodeKind = 'start' | 'combat' | 'elite' | 'event' | 'shop' | 'rest' | 'boss';

export interface MapNode {
  readonly id: string;
  readonly kind: NodeKind;
  readonly row: number;
  /** 0-indexed act this node belongs to (single mode = all act 0). */
  readonly act: number;
  readonly next: readonly string[];
}

export interface RunMap {
  readonly nodes: Readonly<Record<string, MapNode>>;
  readonly startId: string;
  readonly bossId: string;
}

// ---- Combat ----

export interface EnemyInstance {
  readonly defId: string;
  readonly name: string;
  readonly hp: number;
  readonly maxHp: number;
  readonly block: number;
  readonly statuses: Statuses;
  readonly nextMoveIndex: number;
}

export interface CombatState {
  readonly enemies: readonly EnemyInstance[];
  /** Card def ids. M1 has no per-instance card state (no upgrades yet). */
  readonly hand: readonly string[];
  readonly drawPile: readonly string[];
  readonly discardPile: readonly string[];
  readonly energy: number;
  readonly maxEnergy: number;
  /** Player HP is copied in at combat start and synced back at combat end. */
  readonly playerHp: number;
  readonly playerMaxHp: number;
  readonly playerBlock: number;
  readonly playerStatuses: Statuses;
  readonly turn: number;
}

// ---- Run ----

export type Phase =
  | 'map'
  | 'combat'
  | 'reward'
  | 'shop'
  | 'rest'
  | 'event'
  | 'victory'
  | 'defeat';

/** Pending effects granted by bounded modifiers (REQ-5). */
export interface RunModifiers {
  readonly nextCombatStatuses: Statuses;
  readonly queuedEliteIds: readonly string[];
}

export interface RunState {
  readonly seed: string;
  readonly rng: RngStreams;
  readonly map: RunMap;
  readonly currentNodeId: string;
  readonly phase: Phase;
  readonly hp: number;
  readonly maxHp: number;
  readonly gold: number;
  readonly deck: readonly string[];
  readonly relics: readonly string[];
  /** Consumable potions currently held (potion def ids). Capped at maxPotions. */
  readonly potions: readonly string[];
  /** Potion slot limit baked into this run (keeps the reducer self-contained). */
  readonly maxPotions: number;
  readonly combat: CombatState | null;
  readonly reward: {
    readonly cards: readonly string[];
    readonly gold: number;
    readonly relicId?: string;
    /** Potion granted by this reward (auto-added to the satchel when resolved). */
    readonly potionId?: string;
  } | null;
  readonly shop: {
    readonly stock: readonly { readonly cardId: string; readonly price: number; readonly sold: boolean }[];
    readonly potionStock: readonly { readonly potionId: string; readonly price: number; readonly sold: boolean }[];
  } | null;
  readonly event: {
    readonly eventId: string;
    /**
     * Set once an option has been resolved: the concrete (simple) outcomes that
     * were applied, plus whether a probabilistic roll was involved. While this
     * is set the run stays in the 'event' phase showing a result screen until
     * `continueEvent` clears it back to the map.
     */
    readonly result?: {
      readonly applied: readonly SimpleEventOutcome[];
      readonly rolled: boolean;
    };
  } | null;
  readonly modifiers: RunModifiers;
  /** Difficulty enemy-HP multiplier baked into this run (1 = neutral). */
  readonly enemyHpMult: number;
}

export type GameAction =
  | { type: 'chooseNode'; nodeId: string }
  | { type: 'playCard'; handIndex: number; targetIndex?: number }
  | { type: 'usePotion'; potionIndex: number; targetIndex?: number }
  | { type: 'endTurn' }
  | { type: 'pickRewardCard'; index: number }
  | { type: 'skipReward' }
  | { type: 'buyCard'; index: number }
  | { type: 'buyPotion'; index: number }
  | { type: 'leaveShop' }
  | { type: 'rest' }
  | { type: 'upgradeCard'; deckIndex: number }
  | { type: 'chooseEventOption'; index: number }
  | { type: 'continueEvent' };

/** Read the player-state value an event check/requirement compares against. */
export function eventCheckValue(state: RunState, check: EventCheck): number {
  switch (check) {
    case 'gold':
      return state.gold;
    case 'hp':
      return state.hp;
    case 'maxHp':
      return state.maxHp;
    case 'relics':
      return state.relics.length;
    case 'deck':
      return state.deck.length;
  }
}

/** True iff the option's requirement (if any) is satisfied by the state. */
export function eventRequirementMet(state: RunState, requires?: EventRequirement): boolean {
  if (!requires) return true;
  return eventCheckValue(state, requires.check) >= requires.atLeast;
}

export class EngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EngineError';
  }
}

/**
 * Safe boundaries are where saves happen and where queued modifiers may
 * apply (REQ-5, REQ-9). The engine — not callers — defines them.
 */
export function isSafeBoundary(state: RunState): boolean {
  return state.phase !== 'combat';
}
