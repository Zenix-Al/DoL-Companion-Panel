import { createCheat } from '../../create-cheat.js';

export const cumCheat = createCheat({
  id: 'player.cum',
  location: { section: 'stats', group: 'player', order: 83 },
  meta: {
    label: 'Cum',
    controls: [
      { key: 'volume', type: 'input', binding: { path: 'semen_volume' } },
      { key: 'set', type: 'button', label: 'Set', action: 'set' },
      { key: 'refill', type: 'button', label: 'Refill', action: 'refill' },
    ],
  },
  requiredPaths: ['semen_volume', 'semen_amount'],
  refresh: ['mount', 'section-open'],
  actions: {
    set({ game, controls }) {
      const value = Number.parseInt(controls.value('volume'), 10);
      if (Number.isNaN(value))
        return { ok: false, kind: 'validation', message: 'Input is not a number.' };
      game.set('semen_volume', value);
      return { ok: true, message: 'Cum volume updated.' };
    },
    refill({ game }) {
      game.set('semen_amount', game.get('semen_volume'));
      return { ok: true, message: 'Cum refilled.' };
    },
  },
});
