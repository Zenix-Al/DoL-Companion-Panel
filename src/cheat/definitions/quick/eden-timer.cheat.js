import { createCheat } from '../../create-cheat.js';

export const edenTimerCheat = createCheat({
  id: 'quick.eden-timer',
  location: { section: 'quick', group: 'tasks', order: 60 },
  meta: {
    label: 'Eden Timer',
    controls: [{ key: 'enabled', type: 'toggle', label: 'Timer', action: 'toggle' }],
  },
  requiredPaths: ['edendays'],
  toggle: { cadence: 'daily', maxFailures: 5, runOnActivate: true },
  effect({ game }) {
    game.set('edendays', 0);
  },
});
