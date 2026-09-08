import { createCheat } from '../../create-cheat.js';

export const maximumNpcPregnancyRateCheat = createCheat({
  id: 'quick.maximum-npc-pregnancy-rate',
  location: { section: 'quick', group: 'pregnancy', order: 110 },
  meta: {
    label: 'Maximum NPC Pregnancy Rate',
    controls: [
      {
        key: 'enabled',
        type: 'toggle',
        label: 'Maximum',
        action: 'toggle',
        tooltip:
          'Gives NPCs the maximum pregnancy rate. Some NPCs still cannot become pregnant; Multiple NPC Pregnancies permits repeated pregnancies.',
      },
    ],
  },
  requiredPaths: ['baseNpcPregnancyChance', 'NPCList'],
  config: ['baseNpcPregnancyChance'],
  toggle: { cadence: 'frame', cooldownMs: 250, maxFailures: 5, runOnActivate: true },
  effect({ game, config }) {
    if (config.get('baseNpcPregnancyChance') === null)
      config.set('baseNpcPregnancyChance', game.get('baseNpcPregnancyChance'));
    game.set('baseNpcPregnancyChance', 19);
    for (const npc of game.get('NPCList')) {
      if (npc?.pregnancyAvoidance > 0) npc.pregnancyAvoidance = 0;
    }
  },
});
