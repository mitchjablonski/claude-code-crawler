/**
 * The combat STAGE: the enemy pack rendered text-first on theme tokens. This
 * component is the SWAPPABLE SEAM for the art pass — its contract is plain
 * data + one callback (`combat`, targeting flag, `onTargetEnemy`), so a
 * PixiJS/WebGL stage can replace it without touching the CombatScreen's
 * dispatch wiring.
 *
 * Mirrors the terminal CombatScreen's enemy block info exactly: `[N]` target
 * markers (popping in accent while targeting), sigil, name, numeric HP +
 * block, the V6 damage/slain/status beats (`-N`, `-N!` big hits, `DOWN`,
 * `+2VUL`…), status tags, the fixed-width HP bar, and the full telegraphed
 * intent (category icon + move name + effect chips).
 */
import type { CombatState, ContentRegistry } from '@game/engine/types.js';
import { enemyBeats, statusBeats, bigHit, usePrevOnChange } from '@game/ui/juice.js';
import { intentIcons } from '@game/ui/theme.js';
import { colors, hpBarSegments, statusSegmentsCss, statusBeatChipCss } from '../theme.js';
import { intentChips, intentKindFor, intentNameFor } from '../intents.js';
import type { CSSProperties } from 'react';

const enemyButton: CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  font: 'inherit',
  color: 'inherit',
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: '6px',
  padding: '0.35rem 0.5rem',
  cursor: 'default',
};

const targetableButton: CSSProperties = {
  ...enemyButton,
  border: `1px solid ${colors.accent}`,
  cursor: 'pointer',
};

export function CombatStage({
  combat,
  content,
  targeting,
  onTargetEnemy,
}: {
  readonly combat: CombatState;
  readonly content: ContentRegistry;
  /** True while a played card/potion is waiting for an enemy target. */
  readonly targeting: boolean;
  readonly onTargetEnemy: (index: number) => void;
}) {
  // V6 juice: diff the combat the player's LAST action changed (shared pure
  // model — the beat persists until the next action recomputes it).
  const priorCombat = usePrevOnChange(combat);
  const beats = enemyBeats(priorCombat, combat);

  return (
    <div role="list" aria-label="enemies">
      {combat.enemies.map((enemy, i) => {
        const def = content.enemies[enemy.defId];
        const sigil = def?.sigil ?? '';
        const alive = enemy.hp > 0;
        const bar = hpBarSegments(enemy.hp, enemy.maxHp);
        const kind = intentKindFor(content, enemy);
        const beat = beats[i];
        const priorEnemy =
          priorCombat && priorCombat.enemies.length === combat.enemies.length
            ? priorCombat.enemies[i]
            : undefined;
        const enemyStatusBeats = statusBeats(priorEnemy?.statuses ?? null, enemy.statuses);
        const statusSegs = statusSegmentsCss(enemy.statuses);
        const targetable = targeting && alive;
        return (
          <button
            key={`${enemy.defId}-${i}`}
            type="button"
            role="listitem"
            aria-disabled={!targetable}
            style={targetable ? targetableButton : enemyButton}
            onClick={() => {
              if (targetable) onTargetEnemy(i);
            }}
          >
            <span style={{ opacity: alive ? 1 : 0.5 }}>
              {targetable && (
                <span style={{ color: colors.accent, fontWeight: 700 }}>[{i + 1}] </span>
              )}
              {sigil !== '' && <span style={{ color: colors.accent }}>{sigil} </span>}
              <span style={{ fontWeight: 700 }}>{enemy.name}</span>{' '}
              {!alive ? (
                beat?.slain ? (
                  <span style={{ color: colors.danger, fontWeight: 700 }}>DOWN</span>
                ) : (
                  'slain'
                )
              ) : (
                <>
                  <span style={{ color: colors.hp }}>{enemy.hp}</span>/{enemy.maxHp}
                  {enemy.block > 0 && (
                    <span style={{ color: colors.block }}> +{enemy.block}blk</span>
                  )}
                  {beat && beat.damage > 0 && (
                    <span style={{ color: colors.danger, fontWeight: 700 }}>
                      {' '}
                      -{beat.damage}
                      {bigHit(beat.damage) ? '!' : ''}
                    </span>
                  )}
                </>
              )}
              {statusSegs.length > 0 && (
                <span>
                  {' ['}
                  {statusSegs.map((seg, si) => (
                    <span key={seg.text} style={{ color: seg.color }}>
                      {si > 0 ? ', ' : ''}
                      {seg.text}
                    </span>
                  ))}
                  {']'}
                </span>
              )}
              {enemyStatusBeats.map((sb) => {
                const chip = statusBeatChipCss(sb.id, sb.delta);
                return (
                  <span key={sb.id} style={{ color: chip.color, fontWeight: 700 }}>
                    {' '}
                    {chip.text}
                  </span>
                );
              })}
            </span>
            {alive && (
              <span style={{ display: 'block', paddingLeft: '1.25rem' }}>
                {'['}
                <span style={{ color: colors.hp }}>{bar.filled}</span>
                <span style={{ color: colors.hpEmpty }}>{bar.empty}</span>
                {'] '}
                <span style={{ color: colors.intent[kind] }}>
                  next: {intentIcons[kind]} {intentNameFor(content, enemy)}
                </span>
                {intentChips(content, enemy).map((chip, ci) => (
                  <span key={`${chip.text}-${ci}`} style={{ color: chip.color }}>
                    {'  '}
                    {chip.text}
                  </span>
                ))}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
