import { createCheat } from '../../create-cheat.js';

export const unlimitedCumCheat = createCheat({
  id: 'quick.unlimited-cum',
  location: { section: 'quick', group: 'unlimited', order: 30 },
  meta: {
    label: 'Unlimited Cum',
    controls: [{ key: 'enabled', type: 'toggle', label: 'Cum', action: 'toggle' }],
  },
  requiredPaths: ['semen_amount', 'semen_volume', 'orgasmcount'],
  toggle: { cadence: 'frame', cooldownMs: 100, maxFailures: 5, runOnActivate: true },
  effect({ game }) {
    if (game.get('semen_amount') >= game.get('semen_volume')) return;
    game.set('semen_amount', game.get('semen_volume'));
    game.set('orgasmcount', 0);
  },
});
