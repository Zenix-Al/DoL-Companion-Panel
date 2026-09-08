import { createCheat } from '../../create-cheat.js';

export const lactationCheat = createCheat({
  id: 'player.lactation',
  location: { section: 'stats', group: 'player', order: 81 },
  meta: {
    label: 'Lactation',
    controls: [{ key: 'toggle', type: 'button', label: 'Yes', action: 'toggle' }],
  },
  requiredPaths: ['lactating'],
  refresh: ['mount', 'section-open'],
  actions: {
    toggle({ game }) {
      game.set('lactating', game.get('lactating') == 1 ? 0 : 1);
      return { ok: true, message: 'Lactation updated.', refresh: true };
    },
  },
  sync({ game, controls }) {
    controls.text('toggle', game.get('lactating') == 1 ? 'No' : 'Yes');
  },
});
