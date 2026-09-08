import { createCheat } from '../../create-cheat.js';

export const unlimitedSprayCheat = createCheat({
  id: 'player.unlimited-spray',
  location: { section: 'stats', group: 'player', order: 15 },
  meta: {
    label: 'Unlimited Spray',
    controls: [{ key: 'toggle', type: 'button', label: 'Set', action: 'toggle' }],
  },
  requiredPaths: ['infinitespray'],
  refresh: ['mount', 'section-open'],
  actions: {
    toggle({ game }) {
      game.set('infinitespray', game.get('infinitespray') === 1 ? 0 : 1);
      return { ok: true, message: 'Unlimited spray updated.', refresh: true };
    },
  },
  sync({ game, controls }) {
    controls.text('toggle', game.get('infinitespray') === 1 ? 'Unset' : 'Set');
  },
});
