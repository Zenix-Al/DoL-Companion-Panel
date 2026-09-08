import { createCheat } from '../../create-cheat.js';

export const enemyStateCheat = createCheat({
  id: 'quick.enemy-state',
  location: { section: 'quick', group: 'state', order: 30 },
  meta: {
    label: 'Enemy State',
    controls: [
      { key: 'recover', type: 'button', label: 'Recover', action: 'recover' },
      { key: 'ruin', type: 'button', label: 'Ruin', action: 'ruin' },
    ],
  },
  actions: {
    recover({ game }) {
      game.set('enemyhealth', Number(game.get('enemyhealthmax')) > 0 ? 100 : 0);
      game.set('enemytrust', 100);
      game.set('enemyanger', 0);
      return { ok: true, message: 'Enemy recovered.' };
    },
    ruin({ game }) {
      game.set('enemyhealth', 0);
      game.set('enemytrust', 100);
      game.set('enemyanger', 0);
      return { ok: true, message: 'Enemy ruined.' };
    },
  },
});
