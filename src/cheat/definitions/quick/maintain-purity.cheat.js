import { createCheat } from '../../create-cheat.js';

export const maintainPurityCheat = createCheat({
  id: 'quick.maintain-purity',
  location: { section: 'quick', group: 'unlimited', order: 50 },
  meta: {
    label: 'Maintain Purity',
    controls: [{ key: 'enabled', type: 'toggle', label: 'Pure', action: 'toggle' }],
  },
  requiredPaths: ['purity'],
  toggle: { cadence: 'frame', cooldownMs: 100, maxFailures: 5, runOnActivate: true },
  effect({ game }) {
    game.set('purity', 1000);
  },
});
