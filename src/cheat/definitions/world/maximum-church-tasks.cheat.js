import { createCheat } from '../../create-cheat.js';

export const maximumChurchTasksCheat = createCheat({
  id: 'world.maximum-church-tasks',
  location: { section: 'quick', group: 'tasks', order: 10 },
  meta: {
    label: 'Maximum Church Tasks',
    controls: [{ key: 'enabled', type: 'toggle', label: 'Church', action: 'toggle' }],
  },
  requiredPaths: ['temple_garden', 'temple_quarters', 'grace'],
  toggle: { cadence: 'daily', maxFailures: 5, runOnActivate: true },
  effect({ game }) {
    game.set('temple_garden', 100);
    game.set('temple_quarters', 100);
    game.set('grace', 100);
  },
});
