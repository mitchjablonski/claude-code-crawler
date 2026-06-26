import { Box, Text } from 'ink';
import type { RunState } from '../../engine/types.js';
import { theme, statusSegments } from '../theme.js';
import { usePrevOnChange } from '../juice.js';

export function StatusBar({
  state,
  linked,
  narration,
  relics,
}: {
  readonly state: RunState;
  readonly linked: boolean;
  readonly narration: string | null;
  readonly relics: readonly string[];
}) {
  const combat = state.combat;
  const hp = combat ? combat.playerHp : state.hp;
  // V6 juice: diff the run state across the player's last action to surface
  // transient resource beats — `+Nblk` when block rose (a guard card), `+Ng`
  // when gold rose (rewards/events), `+Nhp` when HP rose (heals/potions/rest).
  // The prior state is held in a ref and only advances on a new state object, so
  // each beat PERSISTS until the next action recomputes it (snapshot-verifiable).
  // Read-only over state; null on first render → no beats.
  const prior = usePrevOnChange(state);
  const priorHp = prior ? (prior.combat ? prior.combat.playerHp : prior.hp) : hp;
  const hpGain = Math.max(0, hp - priorHp);
  // The most important beat to feel: HP lost on the enemy's turn (symmetric to
  // the enemy `-N` damage beat). Only one of gain/loss is ever non-zero.
  const hpLoss = Math.max(0, priorHp - hp);
  const goldGain = prior ? Math.max(0, state.gold - prior.gold) : 0;
  const blockGain =
    prior && prior.combat && combat
      ? Math.max(0, combat.playerBlock - prior.combat.playerBlock)
      : 0;
  // The player's own combat statuses, rendered with the SAME canonical glyphs
  // (icon + identity color + format) as enemy tags and intent chips. Only shown
  // in combat and only when the player actually has statuses — additive, so the
  // HUD/narration rows are untouched when there's nothing to show.
  const playerStatusSegs = combat ? statusSegments(combat.playerStatuses) : [];
  return (
    <Box flexDirection="column">
      <Box width={theme.layout.contentWidth} paddingX={1} justifyContent="space-between">
        <Text>
          <Text color={theme.colors.hp} bold>
            HP {hp}/{state.maxHp}
          </Text>
          {hpGain > 0 && (
            <Text color={theme.colors.success} bold>
              {' '}
              +{hpGain}hp
            </Text>
          )}
          {hpLoss > 0 && (
            <Text color={theme.colors.danger} bold>
              {' '}
              -{hpLoss}hp
            </Text>
          )}
          {combat && (
            <>
              <Text color={theme.colors.block}>{'  '}BLK {combat.playerBlock}</Text>
              {blockGain > 0 && (
                <Text color={theme.colors.block} bold>
                  {' '}
                  +{blockGain}blk
                </Text>
              )}
              <Text color={theme.colors.energy}>
                {'  '}EN {combat.energy}/{combat.maxEnergy}
              </Text>
            </>
          )}
          {playerStatusSegs.length > 0 && (
            <>
              <Text>{'  ['}</Text>
              {playerStatusSegs.map((seg, i) => (
                <Text key={seg.text} color={seg.color}>
                  {i > 0 ? ', ' : ''}
                  {seg.text}
                </Text>
              ))}
              <Text>{']'}</Text>
            </>
          )}
        </Text>
        <Text>
          <Text color={theme.colors.gold}>{state.gold}g</Text>
          {goldGain > 0 && (
            <Text color={theme.colors.gold} bold>
              {' '}
              +{goldGain}g
            </Text>
          )}
          {/* `deck N` (the WHOLE deck) is redundant in combat — the deck is
              split across draw/disc/hand, surfaced on the combat-only pile line
              below. So show `deck N` only OUT of combat; in combat the pile line
              is the meaningful breakdown. */}
          {!combat && (
            <Text dimColor>
              {'  '}deck {state.deck.length}
            </Text>
          )}
          <Text color={theme.colors.accent}>
            {'  '}pots {state.potions.length}/{state.maxPotions}
          </Text>
        </Text>
      </Box>
      {/* Combat-only pile clock: how many cards remain to draw vs already spent,
          plus the live hand size — the tempo signal a deckbuilder reads to know
          when a reshuffle is coming. On its OWN compact row (never the crowded
          row 1), so it CANNOT overflow contentWidth no matter how many player
          status chips are present. Only rendered while in combat. */}
      {combat && (
        <Box width={theme.layout.contentWidth} paddingX={1}>
          <Text>
            <Text color={theme.colors.accent}>draw </Text>
            <Text>{combat.drawPile.length}</Text>
            <Text color={theme.colors.muted}>{'  '}disc </Text>
            <Text>{combat.discardPile.length}</Text>
            <Text color={theme.colors.muted}>{'  '}hand </Text>
            <Text>{combat.hand.length}</Text>
          </Text>
        </Box>
      )}
      {relics.length > 0 && (
        <Box width={theme.layout.contentWidth} paddingX={1}>
          <Text color={theme.colors.accent} wrap="truncate">
            relics: {relics.join(', ')}
          </Text>
        </Box>
      )}
      {/* Narration and the dungeon-link each get their OWN full-width row so
          neither clips the other. The dungeon-link is the game's core premise
          (the dungeon reacts to your real session) and must always be fully
          visible; narration gets the FULL contentWidth (no side padding) so a
          long beat still reads end-to-end instead of being clipped by a peer. */}
      <Box width={theme.layout.contentWidth}>
        <Text dimColor wrap="truncate">
          {narration ?? ''}
        </Text>
      </Box>
      <Box width={theme.layout.contentWidth} paddingX={1}>
        <Text dimColor>{linked ? 'dungeon: linked' : 'dungeon: dormant (ccc init)'}</Text>
      </Box>
    </Box>
  );
}
