/**
 * Minimal in-run HUD strip: the same core info row the terminal StatusBar leads
 * with — tinted HP, gold, depth/floor, deck size, potion slots, and the class
 * tag. One line, token-styled, present on every in-run screen.
 */
import type { RunState } from '@game/engine/types.js';
import { colors, hpTintCss } from '../theme.js';
import { mutedText } from '../ui.js';
import type { CSSProperties } from 'react';

const strip: CSSProperties = {
  width: 'min(46rem, 100%)',
  display: 'flex',
  gap: '1.25rem',
  flexWrap: 'wrap',
  padding: '0.5rem 0.25rem',
  marginBottom: '0.75rem',
  borderBottom: `1px solid ${colors.muted}`,
};

export function HudStrip({
  state,
  characterName,
}: {
  readonly state: RunState;
  readonly characterName: string;
}) {
  const hp = state.combat ? state.combat.playerHp : state.hp;
  const depth = state.map.nodes[state.currentNodeId]?.row ?? 0;
  const bossRow = state.map.nodes[state.map.bossId]?.row ?? 0;
  return (
    <div style={strip} aria-label="run status">
      <span style={{ color: hpTintCss(hp, state.maxHp), fontWeight: 700 }}>
        HP {hp}/{state.maxHp}
      </span>
      <span style={{ color: colors.gold }}>{state.gold}g</span>
      <span style={mutedText}>
        depth {depth}/{bossRow}
      </span>
      <span style={mutedText}>deck {state.deck.length}</span>
      <span style={{ color: colors.accent }}>
        pots {state.potions.length}/{state.maxPotions}
      </span>
      <span style={mutedText}>[{characterName}]</span>
    </div>
  );
}
