import { createCheat } from '../../create-cheat.js';

export const maximumStrayTasksCheat = createCheat({
  id: 'quick.maximum-stray-tasks',
  location: { section: 'quick', group: 'tasks', order: 20 },
  meta: {
    label: 'Maximum Stray Tasks',
    controls: [{ key: 'enabled', type: 'toggle', label: 'Stray', action: 'toggle' }],
  },
  requiredPaths: ['stray_happiness'],
  toggle: { cadence: 'daily', maxFailures: 5, runOnActivate: true },
  effect({ game }) {
    game.set('stray_happiness', 100);
  },
});
