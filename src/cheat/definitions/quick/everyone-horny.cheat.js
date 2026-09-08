import { createCheat } from '../../create-cheat.js';

export const everyoneHornyCheat = createCheat({
  id: 'quick.everyone-horny',
  location: { section: 'quick', group: 'unlimited', order: 60 },
  meta: {
    label: 'Everyone Is Horny',
    controls: [{ key: 'enabled', type: 'toggle', label: 'Horny', action: 'toggle' }],
  },
  requiredPaths: ['NPCName'],
  toggle: { cadence: 'frame', cooldownMs: 100, maxFailures: 5, runOnActivate: true },
  effect({ game }) {
    for (const [index, npc] of (game.get('NPCName') ?? []).entries()) {
      if ((npc.nam ?? npc.description) === 'Ivory Wraith') continue;
      game.set(`NPCName.${index}.lust`, 100);
    }
  },
});
