import { createCheat } from '../../create-cheat.js';

export const farmSafetyCheat = createCheat({
  id: 'quick.farm-safety',
  location: { section: 'quick', group: 'unlimited', order: 70 },
  meta: {
    label: 'Farm Safety',
    controls: [{ key: 'enabled', type: 'toggle', label: 'Safe', action: 'toggle' }],
  },
  requiredPaths: ['farm.aggro'],
  toggle: { cadence: 'frame', cooldownMs: 100, maxFailures: 5, runOnActivate: true },
  effect({ game }) {
    game.set('farm.aggro', 0);
  },
});
