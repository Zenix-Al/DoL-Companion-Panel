import { createCheat } from '../../create-cheat.js';

export const edenSpringCheat = createCheat({
  id: 'quick.eden-spring',
  location: { section: 'quick', group: 'tasks', order: 50 },
  meta: {
    label: 'Eden Spring',
    controls: [{ key: 'enabled', type: 'toggle', label: 'Spring', action: 'toggle' }],
  },
  requiredPaths: ['edenspring'],
  toggle: { cadence: 'daily', maxFailures: 5, runOnActivate: true },
  effect({ game }) {
    game.set('edenspring', 4);
  },
});
