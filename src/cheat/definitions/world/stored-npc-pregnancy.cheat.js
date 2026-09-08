import { createCheat } from '../../create-cheat.js';

const LOCK_JOB_ID = 'world.stored-npc-pregnancy.lock';
const lockedDays = new Map();

function options({ game }) {
  return Object.entries(game.get('storedNPCs') ?? {})
    .filter(([, npc]) => npc?.pregnancy?.fetus?.[0]?.mother)
    .map(([key, npc]) => ({ value: key, label: npc.pregnancy.fetus[0].mother }));
}

function applyLocks(game) {
  for (const [key, days] of lockedDays) {
    const timerEnd = game.get(`storedNPCs.${key}.pregnancy.timerEnd`);
    if (!Number.isFinite(timerEnd)) continue;
    game.set(`storedNPCs.${key}.pregnancy.timer`, Math.max(0, timerEnd - days * 3));
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

export const storedNpcPregnancyCheat = createCheat({
  id: 'world.stored-npc-pregnancy',
  location: { section: 'misc', group: 'pregnancy', order: 30 },
  meta: {
    label: 'NPC Pregnancy',
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
  requiredPaths: ['storedNPCs'],
  refresh: ['mount', 'section-open'],
  actions: {
    select() {
      return { ok: true, refresh: true };
    },
    set(context) {
      const key = context.controls.value('npc');
      const days = Number.parseInt(context.controls.value('days'), 10);
      const timerEnd = context.game.get(`storedNPCs.${key}.pregnancy.timerEnd`);
      if (!key || Number.isNaN(days) || !Number.isFinite(timerEnd))
        return { ok: false, kind: 'validation', message: 'Pregnancy data is unavailable.' };
      if (context.controls.checked('locked')) lockedDays.set(key, days);
      else lockedDays.delete(key);
      context.game.set(`storedNPCs.${key}.pregnancy.timer`, Math.max(0, timerEnd - days * 3));
      syncSchedule(context);
      return { ok: true, message: 'NPC pregnancy updated.', refresh: true };
    },
  },
  sync({ game, controls }) {
    const key = controls.value('npc');
    const timer = game.get(`storedNPCs.${key}.pregnancy.timer`);
    const timerEnd = game.get(`storedNPCs.${key}.pregnancy.timerEnd`);
    controls.setValue('days', Number.isFinite(timerEnd - timer) ? (timerEnd - timer) / 3 : '');
    controls.setValue('locked', lockedDays.has(key));
  },
  onEnable(context) {
    syncSchedule(context);
    return () => context.services.scheduler?.unregister(LOCK_JOB_ID, { cadence: 'frame' });
  },
});
