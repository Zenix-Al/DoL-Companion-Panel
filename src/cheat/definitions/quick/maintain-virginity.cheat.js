import { createCheat } from '../../create-cheat.js';

export const maintainVirginityCheat = createCheat({
  id: 'quick.maintain-virginity',
  location: { section: 'quick', group: 'unlimited', order: 40 },
  meta: {
    label: 'Maintain Virginity',
    controls: [{ key: 'enabled', type: 'toggle', label: 'Virgin', action: 'toggle' }],
  },
  requiredPaths: ['player.virginity.penile', 'player.virginity.vaginal'],
  toggle: { cadence: 'frame', cooldownMs: 100, maxFailures: 5, runOnActivate: true },
  effect({ game }) {
    game.set('player.virginity.penile', true);
    game.set('player.virginity.vaginal', true);
  },
});
