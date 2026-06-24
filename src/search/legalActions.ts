import type { ContentRegistry, GameAction, RunState } from '../engine/types.js';

/** Every action applyAction will accept from this state. Mirrors run.ts guards. */
export function legalActions(content: ContentRegistry, state: RunState): GameAction[] {
  switch (state.phase) {
    case 'map': {
      const next = state.map.nodes[state.currentNodeId]?.next ?? [];
      return next.map((nodeId) => ({ type: 'chooseNode', nodeId }));
    }
    case 'combat': {
      const combat = state.combat;
      if (!combat) return [];
      const actions: GameAction[] = [{ type: 'endTurn' }];
      const living = combat.enemies
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => e.hp > 0)
        .map(({ i }) => i);
      combat.hand.forEach((cardId, handIndex) => {
        const card = content.cards[cardId];
        if (!card || card.cost > combat.energy) return;
        if (card.target === 'enemy') {
          for (const targetIndex of living) {
            actions.push({ type: 'playCard', handIndex, targetIndex });
          }
        } else {
          actions.push({ type: 'playCard', handIndex });
        }
      });
      state.potions.forEach((potionId, potionIndex) => {
        const potion = content.potions[potionId];
        if (!potion) return;
        if (potion.target === 'enemy') {
          for (const targetIndex of living) {
            actions.push({ type: 'usePotion', potionIndex, targetIndex });
          }
        } else {
          actions.push({ type: 'usePotion', potionIndex });
        }
      });
      return actions;
    }
    case 'reward': {
      const actions: GameAction[] = [{ type: 'skipReward' }];
      (state.reward?.cards ?? []).forEach((_, index) =>
        actions.push({ type: 'pickRewardCard', index }),
      );
      return actions;
    }
    case 'shop': {
      const actions: GameAction[] = [{ type: 'leaveShop' }];
      (state.shop?.stock ?? []).forEach((item, index) => {
        if (!item.sold && state.gold >= item.price) actions.push({ type: 'buyCard', index });
      });
      const slotFree = state.potions.length < state.maxPotions;
      (state.shop?.potionStock ?? []).forEach((item, index) => {
        if (slotFree && !item.sold && state.gold >= item.price)
          actions.push({ type: 'buyPotion', index });
      });
      return actions;
    }
    case 'rest':
      return [{ type: 'rest' }];
    case 'event': {
      const def = state.event ? content.events[state.event.eventId] : undefined;
      return (def?.options ?? []).map((_, index) => ({ type: 'chooseEventOption', index }));
    }
    case 'victory':
    case 'defeat':
      return [];
  }
}
