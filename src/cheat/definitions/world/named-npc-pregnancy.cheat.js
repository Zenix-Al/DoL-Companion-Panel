import { createCheat } from '../../create-cheat.js';

const LOCK_JOB_ID = 'world.named-npc-pregnancy.lock';
const lockedDays = new Map();

function options({ game }) {
  return (game.get('NPCName') ?? [])
    .map((npc, index) => ({ npc, index }))
    .filter(({ npc }) => npc?.pregnancy?.timer != null)
    .map(({ npc, index }) => ({ value: index, label: npc.nam ?? npc.description }));
}

function applyLocks(game) {
  for (const [index, days] of lockedDays) {
    const timerEnd = game.get(`NPCName.${index}.pregnancy.timerEnd`);
    if (!Number.isFinite(timerEnd)) continue;
    game.set(`NPCName.${index}.pregnancy.timer`, Math.max(0, timerEnd - days * 3));
  }
}

function syncSchedule({ game, services }) {
  services.scheduler?.unregister(LOCK_JOB_ID, { cadence: 'frame' });
  if (!lockedDays.size) return;
  services.scheduler?.register(LOCK_JOB_ID, () => applyLocks(game), {
    cadence: 'frame',
    cooldownMs: 100,
    maxFailures: 5,
  });
}

export const namedNpcPregnancyCheat = createCheat({
  id: 'world.named-npc-pregnancy',
  location: { section: 'misc', group: 'pregnancy', order: 20 },
  meta: {
    label: 'Named NPC Pregnancy',
    controls: [
      {
        key: 'npc',
        type: 'select',
        options,
        fallbackOptions: [{ value: '', label: 'No pregnancies' }],
        action: 'select',
      },
      { key: 'days', type: 'input' },
      { key: 'locked', type: 'toggle', label: 'Lock pregnancy' },
      { key: 'set', type: 'button', label: 'Set', action: 'set' },
    ],
  },
  requiredPaths: ['NPCName'],
  refresh: ['mount', 'section-open'],
  actions: {
    select() {
      return { ok: true, refresh: true };
    },
    set(context) {
      const index = Number.parseInt(context.controls.value('npc'), 10);
      const days = Number.parseInt(context.controls.value('days'), 10);
      const timerEnd = context.game.get(`NPCName.${index}.pregnancy.timerEnd`);
      if (!Number.isInteger(index) || Number.isNaN(days) || !Number.isFinite(timerEnd))
        return { ok: false, kind: 'validation', message: 'Pregnancy data is unavailable.' };
      if (context.controls.checked('locked')) lockedDays.set(index, days);
      else lockedDays.delete(index);
      context.game.set(`NPCName.${index}.pregnancy.timer`, Math.max(0, timerEnd - days * 3));
      syncSchedule(context);
      return { ok: true, message: 'Named NPC pregnancy updated.', refresh: true };
    },
  },
  sync({ game, controls }) {
    const index = Number.parseInt(controls.value('npc'), 10);
    const timer = game.get(`NPCName.${index}.pregnancy.timer`);
    const timerEnd = game.get(`NPCName.${index}.pregnancy.timerEnd`);
    controls.setValue('days', Number.isFinite(timerEnd - timer) ? (timerEnd - timer) / 3 : '');
    controls.setValue('locked', lockedDays.has(index));
  },
  onEnable(context) {
    syncSchedule(context);
    return () => context.services.scheduler?.unregister(LOCK_JOB_ID, { cadence: 'frame' });
  },
});
