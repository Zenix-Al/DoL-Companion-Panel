import { createCheat } from '../../create-cheat.js';

const SECONDS_PER_DAY = 86400;
const ACTIVE_LIMIT = 8;
const HARD_LIMIT = 10;

export function processNpcPregnancyOverflow({ game, config, feedback }) {
  const mainNpcs = game.get('storedNPCs') ?? {};
  const mainLength = Object.keys(mainNpcs).length;
  const priority = config.get('storedNPCsPriority') || 0;
  const currentDate = Math.floor(game.get('timeStamp') / SECONDS_PER_DAY);
  const lastDate = config.get('storedNPCsDate');
  const elapsedTimerUnits = lastDate !== 0 ? (currentDate - lastDate) * 3 : 0;

  if (elapsedTimerUnits === 0) {
    if (mainLength <= ACTIVE_LIMIT) return;
    if (priority >= ACTIVE_LIMIT) return;
  }

  const waitingNpcs = { ...(config.get('storedNPCs') ?? {}) };
  const active = {};
  const waiting = {};
  let activeCount = 0;

  config.set('storedNPCsDate', currentDate);

  for (const npc of Object.values(mainNpcs)) {
    const pregnancy = npc?.pregnancy;
    const remaining = pregnancy.timerEnd - pregnancy.timer;
    if (remaining <= 3 && activeCount <= ACTIVE_LIMIT) {
      active[`stored_${activeCount}`] = npc;
      if (activeCount === ACTIVE_LIMIT)
        feedback.warning?.('An NPC is about to give birth; pregnancy capacity is full today.');
      activeCount += 1;
    } else waiting[`stored_${Object.keys(waiting).length}`] = npc;
  }

  for (const npc of Object.values(waitingNpcs)) {
    const pregnancy = npc?.pregnancy;
    let timer = pregnancy.timer;
    if (elapsedTimerUnits > 0) {
      timer = Math.min(pregnancy.timerEnd, timer + elapsedTimerUnits);
      pregnancy.timer = timer;
    }
    const remaining = pregnancy.timerEnd - timer;
    if (remaining <= 3 && activeCount <= HARD_LIMIT) {
      active[`stored_${activeCount}`] = npc;
      if (activeCount === ACTIVE_LIMIT)
        feedback.warning?.('An NPC is about to give birth; pregnancy capacity is full today.');
      activeCount += 1;
    } else waiting[`stored_${Object.keys(waiting).length}`] = npc;
  }

  config.set('storedNPCsPriority', activeCount);
  config.set('storedNPCs', waiting);
  game.set('storedNPCs', active);
}

export const infiniteNpcPregnancyCheat = createCheat({
  id: 'quick.infinite-npc-pregnancy',
  location: { section: 'quick', group: 'pregnancy', order: 70 },
  meta: {
    label: 'Infinite NPC Pregnancy',
    controls: [
      {
        key: 'enabled',
        type: 'toggle',
        label: 'Preserve',
        action: 'toggle',
        tooltip: 'Stores overflow pregnancies in CheatPlus until they are one day from birth.',
      },
    ],
  },
  requiredPaths: ['storedNPCs', 'timeStamp'],
  config: ['storedNPCs', 'storedNPCsDate', 'storedNPCsPriority'],
  toggle: { cadence: 'daily', maxFailures: 5, runOnActivate: true },
  effect(context) {
    processNpcPregnancyOverflow(context);
  },
});
