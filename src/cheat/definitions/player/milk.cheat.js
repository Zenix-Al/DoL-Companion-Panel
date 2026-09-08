import { createCheat } from '../../create-cheat.js';

export const milkCheat = createCheat({
  id: 'player.milk',
  location: { section: 'stats', group: 'player', order: 82 },
  meta: {
    label: 'Milk',
    controls: [
      { key: 'volume', type: 'input', binding: { path: 'milk_volume' } },
      { key: 'set', type: 'button', label: 'Set', action: 'set' },
      { key: 'refill', type: 'button', label: 'Refill', action: 'refill' },
    ],
  },
  requiredPaths: ['milk_volume', 'milk_amount'],
  refresh: ['mount', 'section-open'],
  actions: {
    set({ game, controls }) {
      const value = Number.parseInt(controls.value('volume'), 10);
      if (Number.isNaN(value))
        return { ok: false, kind: 'validation', message: 'Input is not a number.' };
      game.set('milk_volume', value);
      return { ok: true, message: 'Milk volume updated.' };
    },
    refill({ game }) {
      game.set('milk_amount', game.get('milk_volume'));
      return { ok: true, message: 'Milk refilled.' };
    },
  },
});
