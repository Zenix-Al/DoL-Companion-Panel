import { createCheat } from '../../create-cheat.js';

export const ballsCheat = createCheat({
  id: 'player.balls',
  location: { section: 'stats', group: 'player', order: 40 },
  meta: {
    label: 'Balls',
    controls: [{ key: 'toggle', type: 'button', label: 'Remove', action: 'toggle' }],
  },
  requiredPaths: ['player.ballsExist'],
  refresh: ['mount', 'section-open'],
  actions: {
    toggle({ game }) {
      game.set('player.ballsExist', !game.get('player.ballsExist'));
      return { ok: true, message: 'Balls updated.', refresh: true };
    },
  },
  sync({ game, controls }) {
    controls.text('toggle', game.get('player.ballsExist') ? 'Remove' : 'Add');
  },
});
