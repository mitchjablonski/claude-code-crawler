import type { GameEvent, GameEventKind } from '../events/types.js';
import type { Modifier } from '../engine/modifiers.js';
import type { BucketConfig } from './limiter.js';

export interface RuleOutcome {
  readonly modifier: Modifier | null;
  /** Static flavor line; the Dungeon AI (M5) may replace the words, never the mechanics. */
  readonly narration: string | null;
}

const NONE: RuleOutcome = { modifier: null, narration: null };

export function ruleFor(event: GameEvent): RuleOutcome {
  switch (event.kind) {
    case 'tests_passed':
      return {
        modifier: { kind: 'lootRoll', size: 'big' },
        narration: 'Tests passed. The dungeon, disgusted by competence, tosses you a coin purse.',
      };
    case 'build_passed':
      return {
        modifier: { kind: 'lootRoll', size: 'small' },
        narration: 'The build stands. Loose coins rattle down from the ceiling.',
      };
    case 'tests_failed':
      return {
        modifier: { kind: 'queueElite', enemyId: 'lint-goblin' },
        narration: 'Something failed above. A Lint Goblin has caught your scent.',
      };
    case 'build_failed':
      return {
        modifier: { kind: 'queueElite', enemyId: 'lint-goblin' },
        narration: 'The build collapsed. A Lint Goblin crawls out of the rubble.',
      };
    case 'agent_spawned':
      return {
        modifier: { kind: 'blessNextCombat', status: 'strength', stacks: 1 },
        narration: 'A familiar joins the hunt. +1 Strength next combat.',
      };
    case 'session_started':
      return {
        modifier: { kind: 'healPlayer', amount: 5 },
        narration: 'The dungeon stirs awake. You feel slightly less terrible.',
      };
    case 'code_changed':
      return {
        modifier: { kind: 'lootRoll', size: 'small' },
        narration: event.detail
          ? `Progress echoes from above (${event.detail}). A few coins skitter down.`
          : 'Progress echoes from above. A few coins skitter down.',
      };
    // Pause flow, not modifiers:
    case 'claude_awaits_user':
    case 'attention_required':
    case 'review_requested':
      return NONE;
    // Ambience only:
    case 'file_explored':
    case 'activity':
      return NONE;
  }
}

const DEFAULT_LIMIT: BucketConfig = { capacity: 3, refillPerMinute: 1 };

const LIMITS: Partial<Record<GameEventKind, BucketConfig>> = {
  // Edits fire constantly during real work; keep the coin trickle a trickle.
  code_changed: { capacity: 2, refillPerMinute: 0.5 },
  tests_passed: { capacity: 2, refillPerMinute: 1 },
  build_passed: { capacity: 2, refillPerMinute: 1 },
  // At most 2 goblins can be queued anyway (engine cap); don't burn tokens.
  tests_failed: { capacity: 2, refillPerMinute: 0.5 },
  build_failed: { capacity: 2, refillPerMinute: 0.5 },
  agent_spawned: { capacity: 2, refillPerMinute: 1 },
  session_started: { capacity: 1, refillPerMinute: 0.2 },
};

export function limitFor(kind: string): BucketConfig {
  return LIMITS[kind as GameEventKind] ?? DEFAULT_LIMIT;
}
