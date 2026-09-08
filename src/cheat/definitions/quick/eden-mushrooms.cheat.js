import { createCheat } from '../../create-cheat.js';

export const edenMushroomsCheat = createCheat({
  id: 'quick.eden-mushrooms',
  location: { section: 'quick', group: 'tasks', order: 30 },
  meta: {
    label: 'Eden Mushrooms',
    controls: [{ key: 'enabled', type: 'toggle', label: 'Mushrooms', action: 'toggle' }],
  },
  requiredPaths: ['edenshrooms'],
  toggle: { cadence: 'daily', maxFailures: 5, runOnActivate: true },
  effect({ game }) {
    game.set('edenshrooms', 4);
  },
});
