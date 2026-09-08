import { createCheat } from '../../create-cheat.js';

export const multipleNpcPregnanciesCheat = createCheat({
  id: 'quick.multiple-npc-pregnancies',
  location: { section: 'quick', group: 'pregnancy', order: 120 },
  meta: {
    label: 'Multiple NPC Pregnancies',
    controls: [
      {
        key: 'enabled',
        type: 'toggle',
        label: 'Multiple',
        action: 'toggle',
        tooltip: 'Allows NPCs to become pregnant multiple times.',
      },
    ],
  },
  requiredPaths: ['NPCList'],
  toggle: { cadence: 'frame', cooldownMs: 250, maxFailures: 5, runOnActivate: true },
  effect({ game }) {
    for (const npc of game.get('NPCList')) {
      if (npc?.pregnancy === 1) npc.pregnancy = 0;
    }
  },
});
