import { createCheat } from '../../create-cheat.js';

export const templeVowCheat = createCheat({
  id: 'quick.temple-vow',
  location: { section: 'quick', group: 'state', order: 50 },
  meta: {
    label: 'Temple Vow',
    controls: [
      { key: 'toggle', type: 'button', label: 'Toggle', action: 'toggle' },
      { key: 'current', type: 'text', label: '', intent: 'status' },
    ],
  },
  requiredPaths: ['player.virginity.temple'],
  refresh: ['mount', 'section-open', 'after-action', 'runtime-tick'],
  actions: {
    toggle({ game }) {
      game.set('player.virginity.temple', !game.get('player.virginity.temple'));
      return { ok: true, message: 'Temple vow updated.', refresh: true };
    },
  },
  sync({ game, controls }) {
    controls.text('current', game.get('player.virginity.temple') ? 'Virgin' : 'Not virgin');
  },
});
