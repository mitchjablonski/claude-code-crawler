/**
 * Web theme: the SAME semantic tokens as the terminal theme, expressed as CSS
 * color values. This module does not invent a palette — it imports the terminal
 * theme (`src/ui/theme.ts`, a pure data module) and maps every Ink color name
 * through the shared `palette` hex table, so the two renderers can never drift:
 * a token added or retinted terminal-side shows up here automatically.
 *
 * Token names are kept IDENTICAL to `theme.colors` / `theme.status` so styling
 * stays consistent across renderers (hp/block/energy/gold/accent/danger/success/
 * muted/heat + the rarity/cardType/nodeKind/intent/status maps).
 */
import type { StatusId } from '@game/engine/types.js';
import {
  theme as sharedTheme,
  palette,
  defaultFg,
  background,
  hpTint,
  intentIcons,
  type InkColor,
} from '@game/ui/theme.js';

const css = (token: InkColor): string => palette[token];

function mapCss<K extends string>(record: Readonly<Record<K, InkColor>>): Readonly<Record<K, string>> {
  const out = {} as Record<K, string>;
  for (const key of Object.keys(record) as K[]) out[key] = css(record[key]);
  return out;
}

/** Semantic color tokens -> CSS hex values (same names as the terminal theme). */
export const colors = {
  title: css(sharedTheme.colors.title),
  hp: css(sharedTheme.colors.hp),
  hpHealthy: css(sharedTheme.colors.hpHealthy),
  hpWarning: css(sharedTheme.colors.hpWarning),
  hpCritical: css(sharedTheme.colors.hpCritical),
  heat: css(sharedTheme.colors.heat),
  block: css(sharedTheme.colors.block),
  energy: css(sharedTheme.colors.energy),
  gold: css(sharedTheme.colors.gold),
  success: css(sharedTheme.colors.success),
  danger: css(sharedTheme.colors.danger),
  muted: css(sharedTheme.colors.muted),
  accent: css(sharedTheme.colors.accent),
  cardCost: css(sharedTheme.colors.cardCost),
  hpEmpty: css(sharedTheme.colors.hpEmpty),
  intent: mapCss(sharedTheme.colors.intent),
  nodeKind: mapCss(sharedTheme.colors.nodeKind),
  rarity: mapCss(sharedTheme.colors.rarity),
  cardType: mapCss(sharedTheme.colors.cardType),
} as const;

export interface WebStatusStyle {
  readonly label: string;
  readonly icon: string;
  readonly color: string;
}

/** Status display metadata with the identity color as a CSS value. */
export const status: Readonly<Record<StatusId, WebStatusStyle>> = (() => {
  const out = {} as Record<StatusId, WebStatusStyle>;
  for (const id of Object.keys(sharedTheme.status) as StatusId[]) {
    const s = sharedTheme.status[id];
    out[id] = { label: s.label, icon: s.icon, color: css(s.color) };
  }
  return out;
})();

export { defaultFg, background, intentIcons };

/** #64 HP legibility gradient as a CSS value (same thresholds as terminal). */
export function hpTintCss(hp: number, maxHp: number): string {
  return css(hpTint(hp, maxHp));
}
