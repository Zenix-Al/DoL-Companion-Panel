import { createCheat } from '../../create-cheat.js';

import { processNpcPregnancyOverflow } from './infinite-npc-pregnancy.cheat.js';

let previousNpcCount = 0;
let previousPlayerCount = 0;

function npcCount(game, config) {
  let total = Object.keys(game.get('storedNPCs') ?? {}).length;
  total += Object.keys(config.get('storedNPCs') ?? {}).length;
  for (const npc of game.get('NPCName') ?? []) {
    if (npc?.pregnancy?.fetus?.length > 0) total += 1;
  }
  return total;
}

function playerCount(game) {
  return (
    (game.get('sexStats.vagina.pregnancy.fetus')?.length ?? 0) +
    (game.get('sexStats.anus.pregnancy.fetus')?.length ?? 0)
  );
}

export const pregnancyDetectionCheat = createCheat({
  id: 'quick.pregnancy-detection',
  location: { section: 'quick', group: 'pregnancy', order: 100 },
  meta: {
    label: 'Pregnancy Detection',
    controls: [{ key: 'enabled', type: 'toggle', label: 'Detect', action: 'toggle' }],
  },
  requiredPaths: ['storedNPCs', 'NPCName', 'sexStats', 'timeStamp'],
  config: ['storedNPCs', 'storedNPCsDate', 'storedNPCsPriority'],
  toggle: { cadence: 'frame', cooldownMs: 250, maxFailures: 5, runOnActivate: true },
  onEnable() {
    previousNpcCount = 0;
    previousPlayerCount = 0;
  },
  effect(context) {
    const nextNpcCount = npcCount(context.game, context.config);
    const nextPlayerCount = playerCount(context.game);
    if (previousNpcCount === 0) {
      previousNpcCount = nextNpcCount;
      previousPlayerCount = nextPlayerCount;
      return;
    }
    if (nextNpcCount !== previousNpcCount) {
      context.feedback.info?.(
        nextNpcCount > previousNpcCount ? 'An NPC became pregnant.' : 'An NPC gave birth.'
      );
      processNpcPregnancyOverflow(context);
      previousNpcCount = nextNpcCount;
    }
    if (nextPlayerCount !== previousPlayerCount) {
      context.feedback.info?.(
        nextPlayerCount > previousPlayerCount
          ? 'The player became pregnant.'
          : 'The player gave birth.'
      );
      previousPlayerCount = nextPlayerCount;
    }
  },
});
