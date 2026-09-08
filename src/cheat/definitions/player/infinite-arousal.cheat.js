import { createCheat } from '../../create-cheat.js';

export const infiniteArousalCheat = createCheat({
  id: 'player.infinite-arousal',
  location: { section: 'quick', group: 'unlimited', order: 20 },
  meta: {
    label: 'Unlimited Arousal',
    controls: [{ key: 'enabled', type: 'toggle', label: 'Arousal', action: 'toggle' }],
  },
  requiredPaths: ['arousal'],
  toggle: { cadence: 'frame', cooldownMs: 100, maxFailures: 5, runOnActivate: true },
  effect({ game }) {
    game.set('arousal', 10000);
  },
});
