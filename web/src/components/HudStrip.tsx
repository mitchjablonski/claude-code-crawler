/**
 * In-run HUD: the same info the terminal StatusBar shows — tinted HP, gold,
 * depth/floor, deck size, potion slots, class tag, and (A2) the combat context:
 * BLK / EN, the player's own status chips, the combat pile clock
 * (draw/disc/hand/turn), a relics line, and the V6 action-derived beats
 * (`+Nblk`/`-Nhp`/`+Ng` + status deltas). Beats reuse the SHARED pure juice
 * model (`@game/ui/juice.js` — prior-vs-current diffing, no timers), so a beat
 * persists until the next action exactly like the terminal.
 */
import type { ContentRegistry, RunState } from '@game/engine/types.js';
import { usePrevOnChange, statusBeats } from '@game/ui/juice.js';
import { colors, hpTintCss, statusSegmentsCss, statusBeatChipCss } from '../theme.js';
import { mutedText } from '../ui.js';
import type { CSSProperties } from 'react';

const strip: CSSProperties = {
  width: 'min(46rem, 100%)',
  padding: '0.5rem 0.25rem',
  marginBottom: '0.75rem',
  borderBottom: `1px solid ${colors.muted}`,
};

const row: CSSProperties = {
  display: 'flex',
  gap: '1.25rem',
  flexWrap: 'wrap',
};

export function HudStrip({
  state,
  content,
  characterName,
}: {
  readonly state: RunState;
  readonly content: ContentRegistry;
  readonly characterName: string;
}) {
  const combat = state.combat;
  const hp = combat ? combat.playerHp : state.hp;
  const depth = state.map.nodes[state.currentNodeId]?.row ?? 0;
  const bossRow = state.map.nodes[state.map.bossId]?.row ?? 0;

  // V6 beats: diff the run state across the player's last action (same pure
  // prior-vs-current model as the terminal StatusBar — persists until the next
  // action, so it is test/snapshot-verifiable; null prior => no beats).
  const prior = usePrevOnChange(state);
  const priorHp = prior ? (prior.combat ? prior.combat.playerHp : prior.hp) : hp;
  const hpGain = Math.max(0, hp - priorHp);
  const hpLoss = Math.max(0, priorHp - hp);
  const goldGain = prior ? Math.max(0, state.gold - prior.gold) : 0;
  const blockGain =
    prior && prior.combat && combat
      ? Math.max(0, combat.playerBlock - prior.combat.playerBlock)
      : 0;
  const blockLoss =
    prior && prior.combat && combat
      ? Math.max(0, prior.combat.playerBlock - combat.playerBlock)
      : 0;
  const playerStatusSegs = combat ? statusSegmentsCss(combat.playerStatuses) : [];
  const playerStatusBeats =
    combat && prior?.combat
      ? statusBeats(prior.combat.playerStatuses, combat.playerStatuses)
      : [];
  const relicNames = state.relics.map((id) => content.relics[id]?.name ?? id);

  return (
    <div style={strip} aria-label="run status">
      <div style={row}>
        <span style={{ color: hpTintCss(hp, state.maxHp), fontWeight: 700 }}>
          HP {hp}/{state.maxHp}
          {hpGain > 0 && <span style={{ color: colors.success }}> +{hpGain}hp</span>}
          {hpLoss > 0 && <span style={{ color: colors.danger }}> -{hpLoss}hp</span>}
        </span>
        {combat && (
          <>
            <span style={{ color: colors.block }}>
              BLK {combat.playerBlock}
              {blockGain > 0 && <span style={{ fontWeight: 700 }}> +{blockGain}blk</span>}
              {blockLoss > 0 && <span style={{ fontWeight: 700 }}> -{blockLoss}blk</span>}
            </span>
            <span style={{ color: colors.energy }}>
              EN {combat.energy}/{combat.maxEnergy}
            </span>
            {/* #65 "powered" co-signal, Overclocker only (same gate as terminal). */}
            {characterName === 'Overclocker' && hp < state.maxHp && (
              <span style={{ color: colors.heat, fontWeight: 700 }}>HEAT</span>
            )}
          </>
        )}
        {playerStatusSegs.length > 0 && (
          <span>
            {'['}
            {playerStatusSegs.map((seg, i) => (
              <span key={seg.text} style={{ color: seg.color }}>
                {i > 0 ? ', ' : ''}
                {seg.text}
              </span>
            ))}
            {']'}
          </span>
        )}
        {playerStatusBeats.map((sb) => {
          const chip = statusBeatChipCss(sb.id, sb.delta);
          return (
            <span key={sb.id} style={{ color: chip.color, fontWeight: 700 }}>
              {chip.text}
            </span>
          );
        })}
        <span style={{ color: colors.gold }}>
          {state.gold}g{goldGain > 0 && <span style={{ fontWeight: 700 }}> +{goldGain}g</span>}
        </span>
        <span style={mutedText}>
          depth {depth}/{bossRow}
        </span>
        {/* `deck N` only OUT of combat — in combat the pile row is the breakdown. */}
        {!combat && <span style={mutedText}>deck {state.deck.length}</span>}
        <span style={{ color: colors.accent }}>
          pots {state.potions.length}/{state.maxPotions}
        </span>
        <span style={mutedText}>[{characterName}]</span>
      </div>
      {combat && (
        <div style={row} aria-label="combat piles">
          <span>
            <span style={{ color: colors.accent }}>draw </span>
            {combat.drawPile.length}
            <span style={mutedText}> disc </span>
            {combat.discardPile.length}
            <span style={mutedText}> hand </span>
            {combat.hand.length}
            <span style={mutedText}> turn </span>
            {combat.turn}
          </span>
        </div>
      )}
      {relicNames.length > 0 && (
        <div style={row}>
          <span style={{ color: colors.accent }}>relics: {relicNames.join(', ')}</span>
        </div>
      )}
    </div>
  );
}
