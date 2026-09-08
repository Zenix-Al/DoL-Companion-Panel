import { createCheat } from '../../create-cheat.js';

export const autoChildInteractionCheat = createCheat({
  id: 'quick.auto-child-interaction',
  location: { section: 'quick', group: 'unlimited', order: 90 },
  meta: {
    label: 'Automatic Child Interaction',
    controls: [
      {
        key: 'enabled',
        type: 'toggle',
        label: 'Auto',
        action: 'toggle',
        tooltip: 'You must visit your baby first to trigger automatic interaction.',
      },
    ],
  },
  requiredPaths: ['children'],
  toggle: { cadence: 'frame', cooldownMs: 200, maxFailures: 5, runOnActivate: true },
  effect({ game }) {
    for (const child of Object.values(game.get('children') ?? {})) {
      const local = child?.localVariables;
      if (local?.event !== true) continue;
      local.interactions = (local.interactions ?? 0) + 1;
      local.interactionsTotal = (local.interactionsTotal ?? 0) + 1;
      local.event = false;
    }
  },
});
