/**
 * Rest-site screen: the web mirror of the terminal RestScreen. Menu shows the
 * COMPUTED heal (`[r] Rest (heal N HP)`, the engine's floor(maxHp * 0.2)) and
 * `[u] Upgrade a card (N upgradeable)` (dimmed when none); the upgrade chooser
 * shows each card as a base -> upgraded `was ... -> now ...` comparison with
 * the same paging keys ([n]/[p], esc back, number upgrades). All clickable.
 */
import { useState } from 'react';
import type { ContentRegistry, GameAction, RunState } from '@game/engine/types.js';
import { colors } from '../theme.js';
import { useKeys } from '../useKeys.js';
import * as ui from '../ui.js';
import { mutedText } from '../ui.js';

/** Heal fraction must match the `rest` reducer in run.ts (state.maxHp * 0.2). */
const HEAL_PCT = 20;

/** Same page size as the terminal upgrade chooser. */
const PER_PAGE = 6;

/** Deck cards (with their deck index) that have a valid upgrade target. */
export function upgradeable(
  state: RunState,
  content: ContentRegistry,
): { deckIndex: number; cardId: string; upgradeId: string }[] {
  const out: { deckIndex: number; cardId: string; upgradeId: string }[] = [];
  state.deck.forEach((cardId, deckIndex) => {
    const card = content.cards[cardId];
    if (card?.upgradeTo && content.cards[card.upgradeTo]) {
      out.push({ deckIndex, cardId, upgradeId: card.upgradeTo });
    }
  });
  return out;
}

export function RestScreen({
  state,
  content,
  dispatch,
}: {
  readonly state: RunState;
  readonly content: ContentRegistry;
  readonly dispatch: (action: GameAction) => void;
}) {
  // The engine has no rest sub-phase; the rest/upgrade choice lives here only.
  const [view, setView] = useState<'menu' | 'upgrade'>('menu');
  const [page, setPage] = useState(0);
  const options = upgradeable(state, content);
  const pageCount = Math.max(1, Math.ceil(options.length / PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * PER_PAGE;
  const pageOptions = options.slice(start, start + PER_PAGE);

  const openUpgrade = () => {
    if (options.length === 0) return;
    setPage(0);
    setView('upgrade');
  };
  const upgradeAt = (pageIndex: number) => {
    const option = pageOptions[pageIndex];
    if (option) dispatch({ type: 'upgradeCard', deckIndex: option.deckIndex });
  };

  useKeys((key) => {
    if (view === 'menu') {
      if (key === 'r') dispatch({ type: 'rest' });
      else if (key === 'u') openUpgrade();
      return;
    }
    if (key === 'Escape') {
      setView('menu');
      return;
    }
    if (key === 'n') {
      setPage((p) => Math.min(p + 1, pageCount - 1));
      return;
    }
    if (key === 'p') {
      setPage((p) => Math.max(p - 1, 0));
      return;
    }
    const n = Number(key);
    if (Number.isInteger(n) && n >= 1 && n <= pageOptions.length) upgradeAt(n - 1);
  });

  if (view === 'upgrade') {
    return (
      <section style={{ ...ui.panel, borderColor: colors.success }} aria-label="upgrade a card">
        <h2 style={ui.heading}>Upgrade a card</h2>
        <p style={{ fontWeight: 700 }}>A defensible alcove, warm and quiet.</p>
        <div role="list" aria-label="upgradeable cards">
          {pageOptions.map(({ cardId, upgradeId, deckIndex }, i) => {
            const base = content.cards[cardId];
            const upgraded = content.cards[upgradeId];
            if (!base || !upgraded) return null;
            return (
              <button
                key={`${upgradeId}-${deckIndex}`}
                type="button"
                role="listitem"
                style={ui.button}
                onClick={() => upgradeAt(i)}
              >
                <span style={ui.keyHint}>[{i + 1}]</span>{' '}
                {'('}
                <span style={{ color: colors.cardCost }}>{base.cost}</span>
                {') '}
                <span style={{ fontWeight: 700 }}>{base.name}</span>
                <span style={{ display: 'block', paddingLeft: '1.5rem' }}>
                  <span style={mutedText}>was {base.description}</span>
                  <span style={{ color: colors.accent }}>{'  ->  '}</span>
                  <span style={{ color: colors.success }}>now {upgraded.description}</span>
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          style={{ ...ui.button, marginTop: '0.5rem' }}
          onClick={() => setView('menu')}
        >
          [esc] Back
        </button>
        <p style={ui.footer}>
          {pageCount > 1 ? `page ${safePage + 1}/${pageCount}  [n]ext [p]rev  ` : ''}
          [esc] Back
        </p>
      </section>
    );
  }

  const healAmount = Math.floor((state.maxHp * HEAL_PCT) / 100);
  return (
    <section style={{ ...ui.panel, borderColor: colors.success }} aria-label="the rest site">
      <h2 style={ui.heading}>The Rest Site</h2>
      <p style={{ fontWeight: 700 }}>A defensible alcove, warm and quiet.</p>
      <p style={mutedText}>
        Someone has carved &quot;5 stars, would die here again&quot; into the wall.
      </p>
      <button type="button" style={ui.button} onClick={() => dispatch({ type: 'rest' })}>
        <span style={ui.keyHint}>[r]</span> Rest (heal{' '}
        <span style={{ color: colors.success }}>{healAmount}</span> HP)
      </button>
      <button
        type="button"
        aria-disabled={options.length === 0}
        style={{ ...ui.button, cursor: options.length > 0 ? 'pointer' : 'not-allowed' }}
        onClick={openUpgrade}
      >
        <span style={ui.keyHint}>[u]</span>{' '}
        <span style={options.length > 0 ? undefined : mutedText}>Upgrade a card</span>{' '}
        {options.length === 0 ? (
          <span style={mutedText}>(none upgradeable)</span>
        ) : (
          <span style={mutedText}>
            (<span style={{ color: colors.accent }}>{options.length}</span> upgradeable)
          </span>
        )}
      </button>
      <p style={ui.footer}>[r] rest · [u] upgrade — or click</p>
    </section>
  );
}
