/**
 * Shop screen: the web mirror of the terminal ShopScreen. Card stock + potion
 * stock with prices (sold marked, unaffordable rows dimmed with the price kept
 * readable), the one-per-visit card-removal service with its inline
 * unavailability reason, and leave. Keys: number = buy card, letters = buy
 * potion, [r] = remove chooser ([n]/[p] page, esc back, number removes),
 * [l] = leave; everything clickable.
 *
 * `isBuyable`/`canRemove` mirror the terminal module's exported rules (that
 * module renders through Ink so it cannot be imported into the browser
 * bundle); the engine re-validates every dispatch regardless.
 */
import { useState } from 'react';
import type { ContentRegistry, GameAction, RunState } from '@game/engine/types.js';
import { MIN_DECK_SIZE, SHOP_REMOVAL_COST } from '@game/engine/run.js';
import { colors, POTION_KEYS } from '../theme.js';
import { useKeys } from '../useKeys.js';
import * as ui from '../ui.js';
import { mutedText } from '../ui.js';

/** Mirror of the terminal ShopScreen's `isBuyable` (display gate only). */
export function isBuyable(
  item: { readonly sold: boolean; readonly price: number },
  gold: number,
  slotFree = true,
): boolean {
  return !item.sold && slotFree && gold >= item.price;
}

/** Mirror of the terminal ShopScreen's `canRemove` (display gate only). */
export function canRemove(state: RunState): boolean {
  if (!state.shop || state.shop.removeUsed) return false;
  return state.gold >= SHOP_REMOVAL_COST && state.deck.length > MIN_DECK_SIZE;
}

/** Same page size as the terminal removal chooser (single-digit hotkeys). */
const PER_PAGE = 9;

export function ShopScreen({
  state,
  content,
  dispatch,
}: {
  readonly state: RunState;
  readonly content: ContentRegistry;
  readonly dispatch: (action: GameAction) => void;
}) {
  const stock = state.shop?.stock ?? [];
  const potionStock = state.shop?.potionStock ?? [];
  const potionKeys = POTION_KEYS.slice(0, potionStock.length);
  const slotFree = state.potions.length < state.maxPotions;
  const removable = canRemove(state);
  const removeUsed = state.shop?.removeUsed ?? false;

  // The removal chooser is a screen-local sub-view (no engine shop sub-phase),
  // exactly like the terminal.
  const [view, setView] = useState<'shop' | 'remove'>('shop');
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(state.deck.length / PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * PER_PAGE;
  const pageCards = state.deck.slice(start, start + PER_PAGE);

  const buyCard = (index: number) => {
    const item = stock[index];
    if (item && !item.sold && state.gold >= item.price) {
      dispatch({ type: 'buyCard', index });
    }
  };
  const buyPotion = (index: number) => {
    const item = potionStock[index];
    if (item && !item.sold && slotFree && state.gold >= item.price) {
      dispatch({ type: 'buyPotion', index });
    }
  };
  const removeAt = (pageIndex: number) => {
    if (pageIndex < 0 || pageIndex >= pageCards.length) return;
    dispatch({ type: 'removeCard', deckIndex: start + pageIndex });
    setView('shop');
  };

  useKeys((key) => {
    if (view === 'remove') {
      if (key === 'Escape') {
        setView('shop');
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
      const sel = Number(key);
      if (Number.isInteger(sel) && sel >= 1 && sel <= pageCards.length) removeAt(sel - 1);
      return;
    }
    if (key === 'l') {
      dispatch({ type: 'leaveShop' });
      return;
    }
    if (key === 'r' && removable) {
      setPage(0);
      setView('remove');
      return;
    }
    const potionIndex = potionKeys.indexOf(key);
    if (potionIndex >= 0) {
      buyPotion(potionIndex);
      return;
    }
    const n = Number(key);
    if (Number.isInteger(n) && n >= 1 && n <= stock.length) buyCard(n - 1);
  });

  if (view === 'remove') {
    return (
      <section style={{ ...ui.panel, borderColor: colors.gold }} aria-label="remove a card">
        <h2 style={ui.heading}>Remove a card</h2>
        <p style={{ fontWeight: 700 }}>
          The merchant produces a small, sharp knife. &quot;Some baggage is best left
          behind.&quot;
        </p>
        <p style={mutedText}>
          Cost: <span style={{ color: colors.gold }}>{SHOP_REMOVAL_COST}g</span>
        </p>
        <div role="list" aria-label="removable cards">
          {pageCards.map((cardId, i) => {
            const card = content.cards[cardId];
            if (!card) return null;
            return (
              <button
                key={`${cardId}-${start + i}`}
                type="button"
                role="listitem"
                style={ui.button}
                onClick={() => removeAt(i)}
              >
                <span style={ui.keyHint}>[{i + 1}]</span>{' '}
                {'('}
                <span style={{ color: colors.cardCost }}>{card.cost}</span>
                {') '}
                <span style={{ fontWeight: 700 }}>{card.name}</span>{' '}
                <span style={mutedText}>{card.description}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          style={{ ...ui.button, marginTop: '0.5rem' }}
          onClick={() => setView('shop')}
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

  return (
    <section style={{ ...ui.panel, borderColor: colors.gold }} aria-label="the shop">
      <h2 style={ui.heading}>The Shop</h2>
      <p style={{ fontWeight: 700 }}>
        A cloaked merchant grins. &quot;Adventurer prices,&quot; it says, of the markup.
      </p>
      <div role="list" aria-label="card stock">
        {stock.map((item, i) => {
          const card = content.cards[item.cardId];
          if (!card) return null;
          const buyable = isBuyable(item, state.gold);
          return (
            <button
              key={`${item.cardId}-${i}`}
              type="button"
              role="listitem"
              aria-disabled={!buyable}
              style={{ ...ui.button, cursor: buyable ? 'pointer' : 'not-allowed' }}
              onClick={() => buyCard(i)}
            >
              <span style={ui.keyHint}>[{i + 1}]</span>{' '}
              <span style={buyable ? undefined : mutedText}>
                {'('}
                <span style={{ color: colors.cardCost }}>{card.cost}</span>
                {') '}
                <span style={{ color: buyable ? colors.rarity[card.rarity] : undefined }}>
                  {card.name}
                </span>{' '}
                <span style={{ color: buyable ? colors.cardType[card.type] : undefined }}>
                  {card.type}
                </span>{' '}
                <span style={buyable ? mutedText : undefined}>{card.description}</span>
              </span>{' '}
              {item.sold ? (
                <span style={mutedText}>(sold)</span>
              ) : (
                // Price stays readable even when the row dims (mirrors terminal).
                <span style={{ color: colors.gold }}>{item.price}g</span>
              )}
            </button>
          );
        })}
      </div>
      {potionStock.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          <p style={{ color: colors.accent, fontWeight: 700, margin: '0 0 0.35rem 0' }}>
            Potions:
          </p>
          <div role="list" aria-label="potion stock">
            {potionStock.map((item, i) => {
              const potion = content.potions[item.potionId];
              if (!potion) return null;
              const buyable = isBuyable(item, state.gold, slotFree);
              return (
                <button
                  key={`${item.potionId}-${i}`}
                  type="button"
                  role="listitem"
                  aria-disabled={!buyable}
                  style={{ ...ui.button, cursor: buyable ? 'pointer' : 'not-allowed' }}
                  onClick={() => buyPotion(i)}
                >
                  <span style={ui.keyHint}>({potionKeys[i] ?? '?'})</span>{' '}
                  <span style={buyable ? undefined : mutedText}>
                    {potion.name} - {potion.description}
                  </span>{' '}
                  {item.sold ? (
                    <span style={mutedText}>(sold)</span>
                  ) : (
                    <span style={{ color: colors.gold }}>{item.price}g</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ marginTop: '0.5rem' }}>
        <p style={{ color: colors.accent, fontWeight: 700, margin: '0 0 0.35rem 0' }}>
          Services:
        </p>
        <button
          type="button"
          aria-disabled={!removable}
          style={{ ...ui.button, cursor: removable ? 'pointer' : 'not-allowed' }}
          onClick={() => {
            if (removable) {
              setPage(0);
              setView('remove');
            }
          }}
        >
          <span style={ui.keyHint}>[r]</span>{' '}
          <span style={removable ? undefined : mutedText}>Remove a card</span>{' '}
          <span style={{ color: colors.gold }}>{SHOP_REMOVAL_COST}g</span>
          <span style={mutedText}>
            {removeUsed
              ? ' (already used)'
              : state.deck.length <= MIN_DECK_SIZE
                ? ' (deck too small)'
                : state.gold < SHOP_REMOVAL_COST
                  ? ' (need more gold)'
                  : ''}
          </span>
        </button>
      </div>
      <button
        type="button"
        style={{ ...ui.button, marginTop: '0.5rem' }}
        onClick={() => dispatch({ type: 'leaveShop' })}
      >
        <span style={ui.keyHint}>[l]</span> Leave
      </button>
      <p style={ui.footer}>number: buy card · letter: buy potion · r: remove card · l: leave</p>
    </section>
  );
}
