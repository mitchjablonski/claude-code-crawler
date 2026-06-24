/**
 * Central theme module: the single source of visual truth for the terminal UI.
 *
 * Every screen routes its colors through SEMANTIC tokens (not raw Ink color
 * names) so a future companion "art mirror" can map the same tokens to real
 * art. The canvas-side renderer (scripts/lib/termRender.ts) derives its
 * ANSI->hex table from `theme.palette`, so terminal and any future art share
 * one palette.
 *
 * Purity: this module is data-only. It type-imports from the engine but must
 * not import engine runtime, RNG, or the wall clock.
 */
import type { NodeKind, Rarity, Statuses, StatusId } from '../engine/types.js';

/**
 * The Ink color names the theme uses. Ink accepts any chalk ForegroundColorName
 * (plus hex strings); we constrain ourselves to this stable subset so the
 * canvas mirror can map every value to an ANSI SGR code.
 */
export type InkColor =
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'grey';

/**
 * Hex backing for each Ink color name. This is the canonical palette: the
 * terminal uses the Ink names, the canvas renderer derives pixels from these
 * hex values. Kept identical to the historical termRender palette so existing
 * snapshots/gif look the same.
 */
export const palette: Readonly<Record<InkColor, string>> = {
  red: '#ff6b6b',
  green: '#8bd55a',
  yellow: '#ffd166',
  blue: '#6ea8fe',
  magenta: '#d98cff',
  cyan: '#56d4d4',
  white: '#e6e6e6',
  grey: '#7a8290',
};

/** Foreground for uncolored text and the canvas background. */
export const defaultFg = '#cdd3de';
export const background = '#0b0e14';

/** Semantic color tokens -> Ink color names. */
const colors = {
  /** Screen titles, headings, primary "shiny" emphasis. */
  title: 'yellow',
  /** Player/enemy hit points. */
  hp: 'red',
  /** Block / armor. */
  block: 'cyan',
  /** Energy. */
  energy: 'magenta',
  /** Currency. */
  gold: 'yellow',
  /** Enemy intent / incoming threat. */
  enemyIntent: 'red',
  /** Positive outcome (victory, buff). */
  success: 'green',
  /** Negative outcome (defeat, debuff, danger). */
  danger: 'red',
  /** De-emphasized / secondary text (pairs with Ink dimColor too). */
  muted: 'grey',
  /** Generic accent for relics, statuses, secondary highlights. */
  accent: 'cyan',
  /** Card cost pip. */
  cardCost: 'magenta',
  /** Per node-kind label color (map). */
  nodeKind: {
    start: 'green',
    combat: 'white',
    elite: 'magenta',
    event: 'cyan',
    shop: 'yellow',
    rest: 'green',
    boss: 'red',
  } satisfies Record<NodeKind, InkColor>,
  // TODO(card-frames): consumed by V3 card frames; keep even while unused.
  /** Per-rarity color (reserved for future card-frame work). */
  rarity: {
    starter: 'grey',
    common: 'white',
    uncommon: 'blue',
    rare: 'yellow',
  } satisfies Record<Rarity, InkColor>,
} satisfies Record<string, InkColor | Record<string, InkColor>>;

/** Display metadata for every status effect: short label, plain glyph, color. */
export interface StatusStyle {
  readonly label: string;
  /** Short glyph/letters that render in a plain terminal (ASCII-safe). */
  readonly icon: string;
  readonly color: InkColor;
}

const status: Readonly<Record<StatusId, StatusStyle>> = {
  strength: { label: 'strength', icon: 'STR', color: 'red' },
  dexterity: { label: 'dexterity', icon: 'DEX', color: 'green' },
  vulnerable: { label: 'vulnerable', icon: 'VUL', color: 'yellow' },
  weak: { label: 'weak', icon: 'WK', color: 'blue' },
  regen: { label: 'regen', icon: 'REG', color: 'green' },
  poison: { label: 'poison', icon: 'PSN', color: 'magenta' },
};

/** Shared layout constants. */
const layout = {
  /** Content/text wrap width used across screens (was a magic 76). */
  contentWidth: 76,
} as const;

/**
 * Structural framing tokens. This is the SEAM for bordered panels (V2) and card
 * frames (V3): consumers should read border styles / divider glyphs from here
 * rather than hardcoding box-drawing. Defaults only — no screen draws borders
 * yet. `border` values match Ink's `<Box borderStyle>` names so they can be
 * passed straight through once panels land.
 */
const box = {
  /** Border style for generic bordered panels (Ink borderStyle name). */
  panel: 'round',
  /** Border style for emphasized/highlighted panels (e.g. selected card). */
  emphasis: 'double',
  /** Border color token name (key of `colors`-like semantic set). */
  borderColor: 'muted',
  /** Single-line horizontal divider glyph (plain-terminal safe). */
  divider: '-',
  /** Vertical separator glyph. */
  separator: '|',
} as const;

export const theme = {
  colors,
  status,
  layout,
  box,
  palette,
  defaultFg,
  background,
} as const;

export type Theme = typeof theme;
export type BoxTheme = typeof box;

/**
 * Render an engine `Statuses` map into compact token-styled segments. Dumb
 * presentational helper: returns data, the screen decides how to draw it.
 */
export function statusSegments(
  statuses: Statuses,
): readonly { readonly text: string; readonly color: InkColor }[] {
  return (Object.entries(statuses) as [StatusId, number | undefined][])
    .filter(([, v]) => v !== undefined)
    .map(([id, v]) => {
      const style = status[id];
      return { text: `${style.icon} ${v}`, color: style.color };
    });
}
