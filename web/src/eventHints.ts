/**
 * Event-option hint + result derivations for the web EventScreen. MIRRORS the
 * terminal `src/ui/screens/EventScreen.tsx` pure helpers verbatim
 * (`optionHintSegments`, `requireReason`, `outcomeLine`, `aftermathLine` and
 * their internals) — that module renders through Ink so it cannot be imported
 * into the browser bundle; the derivations are the shared contract, covered by
 * tests here. All pure: static event definitions + theme tokens in, plain data
 * out. A hint reveals an option's STAKES (ranges for a gamble), never the
 * resolved roll.
 */
import type {
  ContentRegistry,
  EventCheck,
  EventOutcome,
  EventRequirement,
  NarrativeEventDef,
  SimpleEventOutcome,
} from '@game/engine/types.js';
import { colors } from './theme.js';

/** Human-readable noun for the field a requirement gates on. */
const CHECK_NOUN: Readonly<Record<EventCheck, string>> = {
  gold: 'gold',
  hp: 'HP',
  maxHp: 'max HP',
  relics: 'relics',
  deck: 'cards',
};

export function requireReason(requires: EventRequirement): string {
  return `need ${requires.atLeast} ${CHECK_NOUN[requires.check]}`;
}

/** One colored fragment of a hint line. */
export interface HintSegment {
  readonly text: string;
  readonly color: string;
}

/** Signed integer, e.g. 5 -> "+5", -3 -> "-3". */
function signed(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

/** Token color for a numeric dimension: gains success, losses danger, 0 muted. */
function deltaColor(n: number): string {
  if (n > 0) return colors.success;
  if (n < 0) return colors.danger;
  return colors.muted;
}

/** Resolve a card/relic id to its display name (falls back to the id). */
function nameOf(outcome: SimpleEventOutcome, content: ContentRegistry): string {
  if (outcome.kind === 'gainCard') return content.cards[outcome.cardId]?.name ?? outcome.cardId;
  if (outcome.kind === 'gainRelic')
    return content.relics[outcome.relicId]?.name ?? outcome.relicId;
  return '';
}

/** The signed numeric delta a SINGLE simple outcome contributes per dimension. */
function numericDelta(
  outcome: SimpleEventOutcome,
  loseHpMult: number,
): { readonly gold: number; readonly hp: number; readonly maxHp: number } {
  switch (outcome.kind) {
    case 'gainGold':
      return { gold: outcome.amount, hp: 0, maxHp: 0 };
    case 'loseGold':
      return { gold: -outcome.amount, hp: 0, maxHp: 0 };
    case 'loseHp':
      // #34: show the difficulty-SCALED amount so stated stakes match reality.
      return { gold: 0, hp: -Math.floor(outcome.amount * loseHpMult), maxHp: 0 };
    case 'gainMaxHp':
      return { gold: 0, hp: 0, maxHp: outcome.amount };
    default:
      return { gold: 0, hp: 0, maxHp: 0 };
  }
}

/** Sum the numeric deltas of a flat list of simple outcomes. */
function sumNumeric(
  outcomes: readonly SimpleEventOutcome[],
  loseHpMult: number,
): { readonly gold: number; readonly hp: number; readonly maxHp: number } {
  return outcomes.reduce(
    (acc, o) => {
      const d = numericDelta(o, loseHpMult);
      return { gold: acc.gold + d.gold, hp: acc.hp + d.hp, maxHp: acc.maxHp + d.maxHp };
    },
    { gold: 0, hp: 0, maxHp: 0 },
  );
}

/** Card/relic display names granted by a flat list of simple outcomes. */
function grantNames(
  outcomes: readonly SimpleEventOutcome[],
  content: ContentRegistry,
): readonly string[] {
  return outcomes
    .filter((o) => o.kind === 'gainCard' || o.kind === 'gainRelic')
    .map((o) => nameOf(o, content));
}

/** A segment for a fixed numeric dimension, e.g. `+30g` / `-6 HP`. Null if 0. */
function fixedNumSegment(n: number, suffix: string): HintSegment | null {
  if (n === 0) return null;
  return { text: `${signed(n)}${suffix}`, color: deltaColor(n) };
}

/** A segment for a RANGE across roll branches, e.g. `+20..+55g`. Null if all 0. */
function rangeNumSegment(min: number, max: number, suffix: string): HintSegment | null {
  if (min === 0 && max === 0) return null;
  if (min === max) return fixedNumSegment(min, suffix);
  const color = max > 0 ? colors.success : colors.danger;
  return { text: `${signed(min)}..${signed(max)}${suffix}`, color };
}

/** Build the hint segments for one option's full outcome list ([] = no hint). */
export function optionHintSegments(
  outcomes: readonly EventOutcome[],
  content: ContentRegistry,
  loseHpMult = 1,
): readonly HintSegment[] {
  const segments: HintSegment[] = [];
  const sep: HintSegment = { text: ', ', color: colors.muted };
  const push = (seg: HintSegment | null) => {
    if (!seg) return;
    if (segments.length > 0) segments.push(sep);
    segments.push(seg);
  };

  // 1) Deterministic part: aggregate every plain simple outcome at the top level.
  const simple = outcomes.filter(
    (o): o is SimpleEventOutcome => o.kind !== 'rollOutcomes' && o.kind !== 'conditional',
  );
  const fixed = sumNumeric(simple, loseHpMult);
  push(fixedNumSegment(fixed.gold, 'g'));
  push(fixedNumSegment(fixed.hp, ' HP'));
  push(fixedNumSegment(fixed.maxHp, ' max HP'));
  for (const name of grantNames(simple, content)) {
    push({ text: `+${name}`, color: colors.success });
  }

  // 2) Composite parts, in author order.
  for (const o of outcomes) {
    if (o.kind === 'rollOutcomes') {
      const sums = o.branches.map((b) => sumNumeric(b, loseHpMult));
      const range = (sel: (s: { gold: number; hp: number; maxHp: number }) => number) => ({
        min: Math.min(...sums.map(sel)),
        max: Math.max(...sums.map(sel)),
      });
      const g = range((s) => s.gold);
      const h = range((s) => s.hp);
      const m = range((s) => s.maxHp);
      push(rangeNumSegment(g.min, g.max, 'g'));
      push(rangeNumSegment(h.min, h.max, ' HP'));
      push(rangeNumSegment(m.min, m.max, ' max HP'));
      // Card/relic grants: present in every branch -> sure; otherwise "maybe".
      const counts = new Map<string, number>();
      for (const branch of o.branches) {
        for (const name of grantNames(branch, content)) {
          counts.set(name, (counts.get(name) ?? 0) + 1);
        }
      }
      for (const [name, count] of counts) {
        const sure = count === o.branches.length;
        push({ text: sure ? `+${name}` : `(${name})`, color: colors.success });
      }
    } else if (o.kind === 'conditional') {
      const clause = (cl: readonly SimpleEventOutcome[]) => {
        const n = sumNumeric(cl, loseHpMult);
        const parts: string[] = [];
        if (n.gold !== 0) parts.push(`${signed(n.gold)}g`);
        if (n.hp !== 0) parts.push(`${signed(n.hp)} HP`);
        if (n.maxHp !== 0) parts.push(`${signed(n.maxHp)} max HP`);
        for (const name of grantNames(cl, content)) parts.push(`+${name}`);
        return parts.length > 0 ? parts.join(' ') : 'nothing';
      };
      push({
        text: `if ${CHECK_NOUN[o.check]}>=${o.atLeast}: ${clause(o.ifPass)} else ${clause(o.ifFail)}`,
        color: colors.muted,
      });
    }
  }

  return segments;
}

/** Format one applied outcome as a styled line (same strings as terminal). */
export function outcomeLine(
  outcome: SimpleEventOutcome,
  content: ContentRegistry,
): { readonly text: string; readonly good: boolean } {
  switch (outcome.kind) {
    case 'gainGold':
      return { text: `+${outcome.amount} gold`, good: true };
    case 'loseGold':
      return { text: `-${outcome.amount} gold`, good: false };
    case 'loseHp':
      return { text: `-${outcome.amount} HP`, good: false };
    case 'gainMaxHp':
      return { text: `+${outcome.amount} max HP`, good: true };
    case 'gainCard': {
      const name = content.cards[outcome.cardId]?.name ?? outcome.cardId;
      return { text: `Added ${name} to your deck`, good: true };
    }
    case 'gainRelic': {
      const name = content.relics[outcome.relicId]?.name ?? outcome.relicId;
      return { text: `Acquired ${name}`, good: true };
    }
  }
}

/** The VALENCE of a resolved outcome list (same weighting as terminal). */
function outcomeValence(applied: readonly SimpleEventOutcome[]): 'win' | 'loss' {
  let score = 0;
  for (const o of applied) {
    switch (o.kind) {
      case 'gainGold':
        score += o.amount;
        break;
      case 'loseGold':
        score -= o.amount;
        break;
      case 'loseHp':
        score -= o.amount;
        break;
      case 'gainMaxHp':
        score += o.amount * 5;
        break;
      case 'gainCard':
      case 'gainRelic':
        score += 100;
        break;
    }
  }
  return score >= 0 ? 'win' : 'loss';
}

/** Generic aftermath lines, keyed by valence (same bank as terminal). */
const AFTERMATH_BANK: Readonly<Record<'win' | 'loss', readonly string[]>> = {
  win: [
    'The dungeon, for once, blinks first. You move on.',
    'You pocket your luck before it changes its mind.',
    'Somewhere, a balance sheet weeps. You walk on richer.',
  ],
  loss: [
    'The dungeon collects, as the dungeon always does. You limp onward.',
    'A lesson, paid in full. You note it and keep moving.',
    'You leave a little of yourself behind. The corridor does not care.',
  ],
};

/** The aftermath flavor line: authored when present, else valence-bank pick. */
export function aftermathLine(
  def: NarrativeEventDef,
  applied: readonly SimpleEventOutcome[],
): string {
  const valence = outcomeValence(applied);
  if (def.aftermath) return def.aftermath[valence];
  const bank = AFTERMATH_BANK[valence];
  return bank[applied.length % bank.length]!;
}
