import { createCheat } from '../../create-cheat.js';

export const moneyCheat = createCheat({
  id: 'player.money',
  location: { section: 'stats', group: 'player', order: 10 },
  meta: {
    label: 'Money',
    controls: [
      { key: 'value', type: 'input', binding: { path: 'money', coerce: 'number' } },
      { key: 'set', type: 'button', label: 'Set', action: 'set' },
    ],
  },
  requiredPaths: ['money'],
  refresh: ['mount', 'section-open', 'after-action'],
  actions: {
    set({ game, controls }) {
      const value = Number.parseInt(controls.value('value'), 10);
      if (Number.isNaN(value)) {
        return { ok: false, kind: 'validation', message: 'Input is not a number.' };
      }
      game.set('money', value);
      return { ok: true, message: 'Money updated.' };
    },
  },
});
