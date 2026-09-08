import { createCheat } from '../../create-cheat.js';

export const edenGardenCheat = createCheat({
  id: 'quick.eden-garden',
  location: { section: 'quick', group: 'tasks', order: 40 },
  meta: {
    label: 'Eden Garden',
    controls: [{ key: 'enabled', type: 'toggle', label: 'Garden', action: 'toggle' }],
  },
  requiredPaths: ['edengarden'],
  toggle: { cadence: 'daily', maxFailures: 5, runOnActivate: true },
  effect({ game }) {
    game.set('edengarden', 4);
  },
});
